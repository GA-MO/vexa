import type { ObservationCache } from "./cache";
import { pagesFileEquals, toPagesFile, type AdminPagesFile } from "./seed";

export type SavePagesResult = { ok: true; written: boolean } | { ok: false; error: string };

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type PagesSyncDeps = { api: string; cache: ObservationCache; fetch?: FetchLike; debounceMs?: number };

export const SYNC_DEBOUNCE_MS = 1000;
const JSON_HEADERS = { "content-type": "application/json" };

function fetchOf(custom: FetchLike | undefined): FetchLike {
  return custom ?? ((input, init) => globalThis.fetch(input, init));
}

export type PagesEndpointInfo = { writable: boolean; pages: unknown };

const NO_ENDPOINT: PagesEndpointInfo = { writable: false, pages: null };

/** Asks the chat endpoint for the pages it serves and whether the dev server can write them back (GET publishes `pagesFile.enabled`, never the path). */
export async function fetchPagesEndpoint(api: string, fetchFn?: FetchLike): Promise<PagesEndpointInfo> {
  try {
    const response = await fetchOf(fetchFn)(api, { method: "GET" });
    if (!response.ok) return NO_ENDPOINT;
    const payload = (await response.json()) as { pagesFile?: { enabled?: boolean }; pages?: unknown } | null;
    return { writable: payload?.pagesFile?.enabled === true, pages: payload?.pages ?? null };
  } catch {
    return NO_ENDPOINT;
  }
}

/** PUTs a pages file to the chat endpoint; the server writes it only when it differs from the file on disk. */
export async function savePagesFile(api: string, file: AdminPagesFile, fetchFn?: FetchLike): Promise<SavePagesResult> {
  try {
    const response = await fetchOf(fetchFn)(api, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ kind: "pages", file }) });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: payload?.error ?? `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as { written?: boolean };
    return { ok: true, written: payload.written === true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Keeps the dev server's pages file current while the user browses: every cache change is debounced and PUT when the structure differs from the last file sent; returns a stop function. */
export function watchPagesFile(deps: PagesSyncDeps): () => void {
  const debounceMs = deps.debounceMs ?? SYNC_DEBOUNCE_MS;
  let lastSent: AdminPagesFile | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const flush = () => {
    if (stopped) return;
    const file = toPagesFile(deps.cache);
    if (lastSent && pagesFileEquals(lastSent, file)) return;
    lastSent = file;
    void savePagesFile(deps.api, file, deps.fetch);
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  const unsubscribe = deps.cache.subscribe(schedule);
  schedule();
  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
  };
}
