import { beforeEach, describe, expect, test } from "bun:test";
import type { AdminPagesFile } from "./seed";
import { clearStoredPages, loadStoredPages, pagesStorageKey, STORED_PAGES_TTL_MS, storePages } from "./store";

const ORIGIN = "http://localhost:3001";
const FILE: AdminPagesFile = {
  version: 1,
  pages: [{ path: "/orders", title: "Orders", elements: [{ ref: "l1", role: "link", name: "Overview", href: "/" }], unnamed: 0 }],
  links: [{ href: "/", name: "Overview" }],
};
const NOW = 1_700_000_000_000;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("stored pages", () => {
  test("round trip through sessionStorage when no scope is given", () => {
    expect(storePages({ origin: ORIGIN }, FILE, { now: NOW })).toBe(true);
    expect(sessionStorage.getItem(pagesStorageKey({ origin: ORIGIN }))).not.toBeNull();
    expect(localStorage.length).toBe(0);
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW + 1000 })).toEqual({ file: FILE, storedAt: NOW });
  });

  test("a scope selects localStorage and changes the key", () => {
    storePages({ origin: ORIGIN, scope: "user-7" }, FILE, { now: NOW });
    expect(pagesStorageKey({ origin: ORIGIN, scope: "user-7" })).toBe(`vexa-pages:${ORIGIN}:user-7`);
    expect(localStorage.getItem(`vexa-pages:${ORIGIN}:user-7`)).not.toBeNull();
    expect(sessionStorage.length).toBe(0);
    expect(loadStoredPages({ origin: ORIGIN, scope: "user-7" }, { now: NOW })?.file).toEqual(FILE);
  });

  test("pages stored for another user are not loaded", () => {
    storePages({ origin: ORIGIN, scope: "user-7" }, FILE, { now: NOW });
    expect(loadStoredPages({ origin: ORIGIN, scope: "user-8" }, { now: NOW })).toBeNull();
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW })).toBeNull();
  });

  test("invalid JSON and an invalid file are ignored", () => {
    sessionStorage.setItem(pagesStorageKey({ origin: ORIGIN }), "{not json");
    expect(loadStoredPages({ origin: ORIGIN })).toBeNull();
    sessionStorage.setItem(pagesStorageKey({ origin: ORIGIN }), JSON.stringify({ file: { version: 9 }, storedAt: NOW }));
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW })).toBeNull();
  });

  test("another app version is ignored", () => {
    storePages({ origin: ORIGIN }, FILE, { now: NOW, version: "build-1" });
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW, version: "build-2" })).toBeNull();
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW, version: "build-1" })?.appVersion).toBe("build-1");
  });

  test("an expired entry is ignored", () => {
    storePages({ origin: ORIGIN }, FILE, { now: NOW });
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW + STORED_PAGES_TTL_MS + 1 })).toBeNull();
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW + 1000, ttlMs: 500 })).toBeNull();
  });

  test("clear removes the entry and a missing storage is harmless", () => {
    storePages({ origin: ORIGIN }, FILE, { now: NOW });
    clearStoredPages({ origin: ORIGIN });
    expect(loadStoredPages({ origin: ORIGIN }, { now: NOW })).toBeNull();
    expect(storePages({ origin: ORIGIN }, FILE, { storage: null })).toBe(false);
    expect(loadStoredPages({ origin: ORIGIN }, { storage: null })).toBeNull();
  });
});
