import { routePath } from "./paths";
import type { Snapshot } from "./snapshot";

export type CachedPage = Snapshot & { observedAt: number };

export type RouteEntry = { path: string; name?: string; sample?: string };

export type LinkRef = { href: string; name: string };

export type ObservationCache = {
  remember(snapshot: Snapshot, observedAt: number, links?: LinkRef[]): void;
  get(path: string): CachedPage | undefined;
  routes(): RouteEntry[];
  observed(): string[];
  entries(): CachedPage[];
  links(): LinkRef[];
  restore(page: CachedPage, links?: LinkRef[]): boolean;
  clear(): void;
  subscribe(listener: () => void): () => void;
};

export const ROUTE_LIMIT = 40;
export const DYNAMIC_SIBLING_THRESHOLD = 3;
const API_PREFIX = "/api/";

function normalizePath(href: string): string | null {
  const path = routePath(href);
  if (!path || path.startsWith(API_PREFIX)) return null;
  return path;
}

function parentOf(path: string): string | null {
  const cut = path.lastIndexOf("/");
  return cut <= 0 ? null : path.slice(0, cut);
}

function groupByParent(paths: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const path of paths) {
    const parent = parentOf(path);
    if (!parent) continue;
    groups.set(parent, [...(groups.get(parent) ?? []), path]);
  }
  return groups;
}

const ID_LIKE_SEGMENT = /\d/;
export const LARGE_SIBLING_COUNT = 6;

function looksDynamic(path: string): boolean {
  return ID_LIKE_SEGMENT.test(path.slice(path.lastIndexOf("/") + 1));
}

function collapsible(children: string[]): string[] {
  const idLike = children.filter(looksDynamic);
  if (idLike.length >= DYNAMIC_SIBLING_THRESHOLD) return idLike;
  return children.length >= LARGE_SIBLING_COUNT ? children : [];
}

function dynamicPatterns(paths: string[]): Map<string, string> {
  const patterns = new Map<string, string>();
  for (const [parent, children] of groupByParent(paths)) {
    for (const child of collapsible(children)) patterns.set(child, `${parent}/:id`);
  }
  return patterns;
}

function buildRoutes(links: Map<string, string>, observed: Set<string>): RouteEntry[] {
  const known = [...new Set([...observed, ...links.keys()])];
  const patterns = dynamicPatterns(known);
  const entries = new Map<string, RouteEntry>();
  for (const path of known) {
    const pattern = patterns.get(path);
    const key = pattern ?? path;
    if (entries.has(key)) continue;
    const entry: RouteEntry = { path: key };
    const name = links.get(path);
    if (name) entry.name = name;
    if (pattern) entry.sample = path;
    entries.set(key, entry);
  }
  return [...entries.values()];
}

function observedFirst(entries: RouteEntry[], observed: Set<string>): RouteEntry[] {
  const isObserved = (entry: RouteEntry) => observed.has(entry.sample ?? entry.path);
  return [...entries.filter(isObserved), ...entries.filter((entry) => !isObserved(entry))];
}

export function createObservationCache(): ObservationCache {
  const pages = new Map<string, CachedPage>();
  const links = new Map<string, string>();
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  function rememberLink(href: string, name: string) {
    const path = normalizePath(href);
    if (!path) return;
    if (!links.get(path)) links.set(path, name);
  }

  function rememberLinks(snapshot: Snapshot, extra: LinkRef[]) {
    for (const element of snapshot.elements) {
      if (element.role === "link" && element.href) rememberLink(element.href, element.name ?? "");
    }
    for (const link of extra) rememberLink(link.href, link.name);
  }

  return {
    remember(snapshot, observedAt, extraLinks = []) {
      const path = normalizePath(snapshot.path) ?? snapshot.path;
      pages.set(path, { ...snapshot, path, observedAt });
      rememberLinks(snapshot, extraLinks);
      notify();
    },
    get(path) {
      return pages.get(normalizePath(path) ?? path);
    },
    routes() {
      const observed = new Set(pages.keys());
      return observedFirst(buildRoutes(links, observed), observed).slice(0, ROUTE_LIMIT);
    },
    observed() {
      return [...pages.keys()];
    },
    entries() {
      return [...pages.values()];
    },
    links() {
      return [...links.entries()].map(([href, name]) => ({ href, name }));
    },
    restore(page, extraLinks = []) {
      const path = normalizePath(page.path) ?? page.path;
      const current = pages.get(path);
      if (current && current.observedAt >= page.observedAt) return false;
      pages.set(path, { ...page, path });
      rememberLinks(page, extraLinks);
      notify();
      return true;
    },
    clear() {
      pages.clear();
      links.clear();
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
