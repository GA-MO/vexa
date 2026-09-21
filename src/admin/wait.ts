import { failure, type AdminFailure } from "./errors";
import type { PageInfo } from "./snapshot";

export type WaitOptions = { quietMs?: number; timeoutMs?: number; pollMs?: number };

export const IDLE_QUIET_MS = 300;
export const WAIT_TIMEOUT_MS = 5000;
export const NAVIGATION_POLL_MS = 50;

export type WaitResult = { ok: true; ms: number } | AdminFailure;

export type IdleResult = { ms: number; settled: boolean };

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function waitForIdle(root: Node, options: WaitOptions = {}): Promise<IdleResult> {
  const quietMs = options.quietMs ?? IDLE_QUIET_MS;
  const timeoutMs = options.timeoutMs ?? WAIT_TIMEOUT_MS;
  const started = Date.now();
  return new Promise((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => armQuietTimer());
    const finish = (result: IdleResult) => {
      observer.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(deadline);
      resolve(result);
    };
    const armQuietTimer = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => finish({ ms: Date.now() - started, settled: true }), quietMs);
    };
    const deadline = setTimeout(() => finish({ ms: Date.now() - started, settled: false }), timeoutMs);
    observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
    armQuietTimer();
  });
}

export async function waitForNavigation(page: () => PageInfo, before: string, options: WaitOptions = {}): Promise<WaitResult> {
  const timeoutMs = options.timeoutMs ?? WAIT_TIMEOUT_MS;
  const pollMs = options.pollMs ?? NAVIGATION_POLL_MS;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (page().path !== before) return { ok: true, ms: Date.now() - started };
    await delay(pollMs);
  }
  return failure("NAVIGATION_TIMEOUT", `still on ${before} after ${timeoutMs} ms`);
}
