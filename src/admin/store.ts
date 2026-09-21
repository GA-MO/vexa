import { parsePagesFile, type AdminPagesFile } from "./seed";

export const STORAGE_KEY_PREFIX = "vexa-pages:";
export const STORED_PAGES_TTL_MS = 24 * 60 * 60 * 1000;

export type StoredPages = { file: AdminPagesFile; storedAt: number; appVersion?: string };

/** Where the pages live: `scope` names the signed-in user and selects localStorage; without it the pages stay in sessionStorage, per tab. */
export type StoredPagesPlace = { origin: string; scope?: string };

export type StoredPagesOptions = { version?: string; ttlMs?: number; now?: number; storage?: Storage | null };

export function pagesStorageKey(place: StoredPagesPlace): string {
  return place.scope ? `${STORAGE_KEY_PREFIX}${place.origin}:${place.scope}` : `${STORAGE_KEY_PREFIX}${place.origin}`;
}

function defaultStorage(place: StoredPagesPlace): Storage | null {
  try {
    if (place.scope) return typeof localStorage === "undefined" ? null : localStorage;
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function storageFor(place: StoredPagesPlace, custom: Storage | null | undefined): Storage | null {
  return custom === undefined ? defaultStorage(place) : custom;
}

function readRecord(storage: Storage, key: string): Record<string, unknown> | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isExpired(storedAt: number, options: StoredPagesOptions): boolean {
  const ttlMs = options.ttlMs ?? STORED_PAGES_TTL_MS;
  const now = options.now ?? Date.now();
  return now - storedAt > ttlMs;
}

/** The pages discovered earlier for this origin and user, unless missing, invalid, from another app version or older than the TTL. */
export function loadStoredPages(place: StoredPagesPlace, options: StoredPagesOptions = {}): StoredPages | null {
  const storage = storageFor(place, options.storage);
  if (!storage) return null;
  const record = readRecord(storage, pagesStorageKey(place));
  if (!record) return null;
  const storedAt = typeof record.storedAt === "number" ? record.storedAt : null;
  if (storedAt === null || isExpired(storedAt, options)) return null;
  const appVersion = typeof record.appVersion === "string" ? record.appVersion : undefined;
  if (options.version !== undefined && appVersion !== options.version) return null;
  const parsed = parsePagesFile(record.file);
  if (!parsed.ok) return null;
  return appVersion === undefined ? { file: parsed.file, storedAt } : { file: parsed.file, storedAt, appVersion };
}

export function storePages(place: StoredPagesPlace, file: AdminPagesFile, options: StoredPagesOptions = {}): boolean {
  const storage = storageFor(place, options.storage);
  if (!storage) return false;
  const record: StoredPages = { file, storedAt: options.now ?? Date.now() };
  if (options.version !== undefined) record.appVersion = options.version;
  try {
    storage.setItem(pagesStorageKey(place), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredPages(place: StoredPagesPlace, storage?: Storage | null): void {
  const target = storageFor(place, storage);
  try {
    target?.removeItem(pagesStorageKey(place));
  } catch {
    return;
  }
}
