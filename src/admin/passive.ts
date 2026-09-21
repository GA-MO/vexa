import type { ObservationCache } from "./cache";
import { collectLinks, snapshot, type PageInfo } from "./snapshot";
import { IDLE_QUIET_MS, type WaitOptions } from "./wait";

export type WatchPagesDeps = {
  root(): ParentNode;
  page(): PageInfo;
  cache: ObservationCache;
  wait?: WaitOptions;
};

function windowOf(root: ParentNode): Window | null {
  const doc = root.ownerDocument ?? (root as Document);
  return doc.defaultView ?? null;
}

function rememberCurrent(deps: WatchPagesDeps) {
  const root = deps.root();
  const capture = snapshot(root, deps.page());
  deps.cache.remember(capture.snapshot, Date.now(), collectLinks(root));
  return capture.snapshot.path;
}

/** Records the current page and every page the user lands on into the observation cache (once more after the first idle, so late-rendered content is included); returns a stop function. */
export function watchPages(deps: WatchPagesDeps): () => void {
  const quietMs = deps.wait?.quietMs ?? IDLE_QUIET_MS;
  const view = windowOf(deps.root());
  let lastPath = rememberCurrent(deps);
  let settledOnce = false;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;

  const rememberIfMoved = () => {
    const moved = deps.page().path !== lastPath;
    if (!moved && settledOnce) return;
    settledOnce = true;
    lastPath = rememberCurrent(deps);
  };
  const armQuietTimer = () => {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(rememberIfMoved, quietMs);
  };

  const observer = new MutationObserver(armQuietTimer);
  observer.observe(deps.root(), { childList: true, subtree: true });
  view?.addEventListener("popstate", armQuietTimer);
  armQuietTimer();

  return () => {
    observer.disconnect();
    view?.removeEventListener("popstate", armQuietTimer);
    clearTimeout(quietTimer);
  };
}
