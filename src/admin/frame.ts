import type { ObservationCache } from "./cache";
import { discoverPages, type DiscoverOptions, type DiscoveryProgress } from "./discover";
import { createResolver } from "./resolve";
import type { NavigateOutcome } from "./run";
import { hrefForPath, routePath } from "./paths";
import { currentPage, isInsideIgnored, type PageInfo } from "./snapshot";
import { waitForIdle, waitForNavigation, type WaitOptions } from "./wait";

export const FRAME_NAME = "vexa-discover";
export const FRAME_LOAD_TIMEOUT_MS = 15_000;

export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 800;
const FRAME_STYLE = `position:fixed;width:${FRAME_WIDTH}px;height:${FRAME_HEIGHT}px;left:-${FRAME_WIDTH + 100}px;top:0;opacity:0;pointer-events:none;border:0`;
const FRAME_SANDBOX = "allow-same-origin allow-scripts";

export type FrameOpenResult =
  | { ok: true; root: ParentNode; page: PageInfo }
  | { ok: false; error: "DISCOVERY_UNAVAILABLE"; detail: string };

export type FrameHost = {
  open(path: string): Promise<FrameOpenResult>;
  navigate(path: string): Promise<NavigateOutcome>;
  page(): PageInfo;
  root(): ParentNode;
  close(): void;
};

export type FrameHostOptions = {
  origin?: string;
  onBlocked?(reason: string): void;
  wait?: WaitOptions;
  loadTimeoutMs?: number;
};

/** True inside the hidden frame discovery opens, so the provider there registers nothing and renders no chat. */
export function isVexaFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.name === FRAME_NAME || window.frameElement?.getAttribute("name") === FRAME_NAME;
  } catch {
    return false;
  }
}


function createFrameElement(doc: Document): HTMLIFrameElement {
  const frame = doc.createElement("iframe");
  frame.name = FRAME_NAME;
  frame.setAttribute("data-vexa-ignore", "");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("inert", "");
  frame.setAttribute("tabindex", "-1");
  frame.setAttribute("sandbox", FRAME_SANDBOX);
  frame.setAttribute("style", FRAME_STYLE);
  frame.setAttribute("title", "Vexa page discovery");
  return frame;
}

function frameDocument(frame: HTMLIFrameElement | null): Document | null {
  if (!frame) return null;
  try {
    return frame.contentDocument;
  } catch {
    return null;
  }
}

function waitForLoad(frame: HTMLIFrameElement, timeoutMs: number): Promise<"load" | "error" | "timeout"> {
  return new Promise((resolve) => {
    const finish = (outcome: "load" | "error" | "timeout") => {
      frame.removeEventListener("load", onLoad);
      frame.removeEventListener("error", onError);
      clearTimeout(deadline);
      resolve(outcome);
    };
    const onLoad = () => finish("load");
    const onError = () => finish("error");
    const deadline = setTimeout(() => finish("timeout"), timeoutMs);
    frame.addEventListener("load", onLoad);
    frame.addEventListener("error", onError);
  });
}

function blocked(detail: string, options: FrameHostOptions): FrameOpenResult {
  options.onBlocked?.(detail);
  return { ok: false, error: "DISCOVERY_UNAVAILABLE", detail };
}

function linkForPath(doc: Document, path: string): HTMLAnchorElement | null {
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href]"));
  return links.find((link) => routePath(link.getAttribute("href") ?? "") === path && !isInsideIgnored(link)) ?? null;
}

/** A hidden same-origin iframe the discovery walks instead of the user's tab; `open` reports why the app cannot be framed when it cannot. */
export function createFrameHost(options: FrameHostOptions = {}): FrameHost {
  const loadTimeoutMs = options.loadTimeoutMs ?? FRAME_LOAD_TIMEOUT_MS;
  let frame: HTMLIFrameElement | null = null;

  function origin(): string {
    return options.origin ?? window.location.origin;
  }

  function ensureFrame(): HTMLIFrameElement {
    if (frame?.isConnected) return frame;
    frame = createFrameElement(document);
    document.body.appendChild(frame);
    return frame;
  }

  function page(): PageInfo {
    const doc = frameDocument(frame);
    return doc ? currentPage(doc) : { path: "", title: "" };
  }

  function root(): ParentNode {
    return frameDocument(frame)?.body ?? document.createDocumentFragment();
  }

  async function load(path: string): Promise<FrameOpenResult> {
    const element = ensureFrame();
    const loading = waitForLoad(element, loadTimeoutMs);
    element.src = `${origin()}${hrefForPath(path, document)}`;
    const outcome = await loading;
    if (outcome === "timeout") return blocked(`${path} did not load within ${loadTimeoutMs} ms`, options);
    if (outcome === "error") return blocked(`${path} failed to load`, options);
    const doc = frameDocument(element);
    if (!doc || doc.location.href === "about:blank") {
      return blocked("the app refuses to be framed (X-Frame-Options or frame-ancestors) or blocks its own pages", options);
    }
    const arrived = currentPage(doc).path;
    if (arrived !== path) return blocked(`${path} redirected to ${arrived}`, options);
    await waitForIdle(doc.body, options.wait);
    return { ok: true, root: doc.body, page: currentPage(doc) };
  }

  async function navigate(path: string): Promise<NavigateOutcome> {
    const doc = frameDocument(frame);
    const link = doc ? linkForPath(doc, path) : null;
    if (link && doc) {
      const before = currentPage(doc).path;
      link.click();
      const arrived = await waitForNavigation(page, before, options.wait);
      if (arrived.ok && page().path === path) return { ok: true, mode: "router" };
    }
    const loaded = await load(path);
    return loaded.ok ? { ok: true, mode: "router" } : { ok: false };
  }

  return {
    open: load,
    navigate,
    page,
    root,
    close() {
      frame?.remove();
      frame = null;
    },
  };
}

export type FrameDiscoveryDeps = { frame: FrameHost; cache: ObservationCache; startPath: string; wait?: WaitOptions };

export type FrameDiscoveryResult = { ok: true; progress: DiscoveryProgress } | { ok: false; detail: string; progress: DiscoveryProgress };

function unavailable(startPath: string, detail: string): FrameDiscoveryResult {
  return {
    ok: false,
    detail,
    progress: { status: "failed", visited: [], pending: 0, errors: [{ path: startPath, error: "DISCOVERY_UNAVAILABLE" }] },
  };
}

/** Runs the read-only page walk inside the hidden frame, filling the shared cache with a throwaway resolver so no ref ever points into the frame. */
export async function discoverInFrame(deps: FrameDiscoveryDeps, options: DiscoverOptions = {}): Promise<FrameDiscoveryResult> {
  const opened = await deps.frame.open(deps.startPath);
  if (!opened.ok) {
    deps.frame.close();
    return unavailable(deps.startPath, opened.detail);
  }
  try {
    const progress = await discoverPages(
      {
        root: () => deps.frame.root(),
        page: () => deps.frame.page(),
        navigate: (path) => deps.frame.navigate(path),
        cache: deps.cache,
        resolver: createResolver(),
        wait: deps.wait,
      },
      options,
    );
    return { ok: true, progress };
  } finally {
    deps.frame.close();
  }
}
