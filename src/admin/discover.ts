import type { ObservationCache, RouteEntry } from "./cache";
import type { AdminErrorCode } from "./errors";
import type { Resolver } from "./resolve";
import { capturePage, type NavigateOutcome } from "./run";
import { INTERACTIVE_ROLES, snapshot, type PageInfo } from "./snapshot";
import { waitForIdle, waitForNavigation, type WaitOptions } from "./wait";

export type DiscoveryStatus = "idle" | "running" | "done" | "failed";

export type DiscoveryError = { path: string; error: AdminErrorCode };

export type DiscoveryProgress = {
  status: DiscoveryStatus;
  current?: string;
  visited: string[];
  pending: number;
  errors: DiscoveryError[];
};

export type DiscoverDeps = {
  root(): ParentNode;
  page(): PageInfo;
  navigate(path: string): Promise<NavigateOutcome>;
  cache: ObservationCache;
  resolver: Resolver;
  wait?: WaitOptions;
};

export type DiscoverOptions = {
  limit?: number;
  skip?: (path: string) => boolean;
  onProgress?: (progress: DiscoveryProgress) => void;
};

export const DISCOVERY_PAGE_LIMIT = 25;

export const IDLE_DISCOVERY: DiscoveryProgress = { status: "idle", visited: [], pending: 0, errors: [] };

function targetOf(route: RouteEntry): string {
  return route.sample ?? route.path;
}

function report(progress: DiscoveryProgress, options: DiscoverOptions): DiscoveryProgress {
  options.onProgress?.(progress);
  return progress;
}

function pendingPaths(deps: DiscoverDeps, visited: Set<string>, failed: Set<string>, skip: (path: string) => boolean): string[] {
  return deps.cache
    .routes()
    .map(targetOf)
    .filter((path) => !visited.has(path) && !failed.has(path) && !skip(path));
}

export const FIRST_CONTROL_TIMEOUT_MS = 3_000;
const FIRST_CONTROL_POLL_MS = 100;

function hasControls(root: ParentNode): boolean {
  return snapshot(root, { path: "", title: "" }).snapshot.elements.some((element) => INTERACTIVE_ROLES.has(element.role));
}

async function waitForFirstControl(root: ParentNode, timeoutMs: number): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (hasControls(root)) return true;
    await new Promise((resolve) => setTimeout(resolve, FIRST_CONTROL_POLL_MS));
  }
  return hasControls(root);
}

/** Records the current page once it shows at least one control; a page that stays empty (a loader, a blank shell) is visited but never stored. */
async function captureHere(deps: DiscoverDeps, visited: Set<string>): Promise<boolean> {
  const path = deps.page().path;
  visited.add(path);
  const ready = await waitForFirstControl(deps.root(), deps.wait?.timeoutMs ?? FIRST_CONTROL_TIMEOUT_MS);
  if (!ready) return false;
  capturePage({ root: deps.root(), page: deps.page, resolver: deps.resolver, now: () => Date.now(), cache: deps.cache });
  return true;
}

async function visit(path: string, deps: DiscoverDeps): Promise<AdminErrorCode | null> {
  const before = deps.page().path;
  const outcome = await deps.navigate(path);
  if (!outcome.ok) return "ROUTE_NOT_FOUND";
  if (outcome.mode === "reload") return null;
  const arrived = await waitForNavigation(deps.page, before, deps.wait);
  if (!arrived.ok) return arrived.error;
  await waitForIdle(deps.root(), deps.wait);
  return null;
}

async function returnTo(start: string, deps: DiscoverDeps) {
  if (deps.page().path === start) return;
  await visit(start, deps);
}

/** Visits every page reachable through links, read-only, and records each in the observation cache; ends back on the page it started from. */
export async function discoverPages(deps: DiscoverDeps, options: DiscoverOptions = {}): Promise<DiscoveryProgress> {
  const limit = options.limit ?? DISCOVERY_PAGE_LIMIT;
  const skip = options.skip ?? (() => false);
  const start = deps.page().path;
  const visited = new Set<string>();
  const failed = new Set<string>();
  const errors: DiscoveryError[] = [];
  const progress = (status: DiscoveryStatus, current?: string): DiscoveryProgress =>
    report({ status, current, visited: [...visited], pending: pendingPaths(deps, visited, failed, skip).length, errors: [...errors] }, options);

  await captureHere(deps, visited);
  progress("running", start);
  while (visited.size < limit) {
    const next = pendingPaths(deps, visited, failed, skip)[0];
    if (!next) break;
    progress("running", next);
    const error = await visit(next, deps);
    if (error) {
      failed.add(next);
      errors.push({ path: next, error });
      continue;
    }
    await captureHere(deps, visited);
  }
  await returnTo(start, deps);
  return progress(errors.length > 0 && visited.size === 1 ? "failed" : "done");
}
