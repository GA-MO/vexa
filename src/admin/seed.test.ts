import { describe, expect, test } from "bun:test";
import { createObservationCache, type CachedPage } from "./cache";
import { exportPages, importPages, pagesFileEquals, parsePagesFile, serializePagesFile, toPagesFile, type AdminPagesFile } from "./seed";

function page(path: string, observedAt: number, title = path): CachedPage {
  return {
    path,
    title,
    elements: [
      { ref: "l1", role: "link", name: "Orders", href: "/orders" },
      { ref: "s2", role: "combobox", name: "Locale", value: "en-US", options: ["en-US", "de-DE"] },
      { ref: "b3", role: "button", name: "Dark", pressed: false },
      { ref: "t4", role: "table", columns: ["Order", "Total"], rows: 24 },
    ],
    unnamed: 0,
    observedAt,
  };
}

function fileOf(...pages: Array<[string, number]>): AdminPagesFile {
  const cache = createObservationCache();
  for (const [path, observedAt] of pages) cache.remember(page(path, observedAt), observedAt, [{ href: "/orders/C-1", name: "C-1" }]);
  return toPagesFile(cache);
}

describe("pages file", () => {
  test("is the same bytes whatever the observation order and state", () => {
    const first = serializePagesFile(fileOf(["/settings", 5], ["/", 7]));
    const second = serializePagesFile(fileOf(["/", 1], ["/settings", 2]));
    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(true);
    expect(first).not.toContain("observedAt");
    expect(first).not.toContain("pressed");
    expect(first).not.toContain('"rows"');
    expect(first).not.toContain('"value"');
    expect(first).toContain('"options"');
  });

  test("sorts pages by path and links by href", () => {
    const file = fileOf(["/settings", 5], ["/", 7]);
    expect(file.pages.map((entry) => entry.path)).toEqual(["/", "/settings"]);
    expect(file.links.map((link) => link.href)).toEqual(["/orders", "/orders/C-1"]);
  });

  test("equality ignores order", () => {
    const a = fileOf(["/settings", 5], ["/", 7]);
    const b: AdminPagesFile = { ...a, pages: [...a.pages].reverse(), links: [...a.links].reverse() };
    expect(pagesFileEquals(a, b)).toBe(true);
    const c: AdminPagesFile = { ...a, pages: a.pages.slice(1) };
    expect(pagesFileEquals(a, c)).toBe(false);
  });

  test("export then import restores pages and links into an empty cache", () => {
    const exported = fileOf(["/settings", 5], ["/", 7]);
    expect(exported.version).toBe(1);
    const target = createObservationCache();
    const result = importPages(target, JSON.parse(JSON.stringify(exported)), 42);
    expect(result).toEqual({ ok: true, pages: 2 });
    expect(target.observed().sort()).toEqual(["/", "/settings"]);
    expect(target.get("/settings")?.observedAt).toBe(42);
    expect(target.routes().some((route) => route.path === "/orders/C-1")).toBe(true);
    expect(pagesFileEquals(exportPages(target), exported)).toBe(true);
  });

  test("invalid or oversized data is rejected with a message and leaves the cache alone", () => {
    const cache = createObservationCache();
    const result = importPages(cache, { version: 2, pages: [], links: [] });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("invalid pages file");
    expect(cache.observed()).toEqual([]);
    const huge = parsePagesFile({ version: 1, pages: [], links: [{ href: "/", name: "x".repeat(2 * 1024 * 1024) }] });
    expect(huge.ok ? "" : huge.error).toContain("2 MB");
  });

  test("a newer live entry wins over an older import and the import fills missing pages", () => {
    const cache = createObservationCache();
    cache.remember(page("/orders", 50, "Live orders"), 50);
    const seed = fileOf(["/orders", 1], ["/products", 1]);
    seed.pages[0].title = "Old orders";
    expect(importPages(cache, seed, 10)).toEqual({ ok: true, pages: 1 });
    expect(cache.get("/orders")?.title).toBe("Live orders");
    expect(cache.get("/products")?.observedAt).toBe(10);
  });
});
