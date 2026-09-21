import { describe, expect, test } from "bun:test";
import { createObservationCache, ROUTE_LIMIT } from "./cache";
import type { Snapshot, SnapshotElement } from "./snapshot";

function link(href: string, name = href): SnapshotElement {
  return { ref: `l${href.length}`, role: "link", name, href };
}

function page(path: string, elements: SnapshotElement[] = []): Snapshot {
  return { path, title: path, elements, unnamed: 0 };
}

describe("observation cache", () => {
  test("remembers pages by path and lists them as observed", () => {
    const cache = createObservationCache();
    cache.remember(page("/orders?x=1#top"), 10);
    expect(cache.get("/orders")?.observedAt).toBe(10);
    expect(cache.get("/orders#top")?.path).toBe("/orders");
    expect(cache.observed()).toEqual(["/orders"]);
  });

  test("routes come from links, deduped, without api paths, queries or hashes", () => {
    const cache = createObservationCache();
    cache.remember(page("/", [link("/orders", "Orders"), link("/orders?page=2", "Next"), link("/api/chat"), link("/settings#theme", "Settings"), link("https://x.y/z")]), 1);
    expect(cache.routes()).toEqual([{ path: "/" }, { path: "/orders", name: "Orders" }, { path: "/settings", name: "Settings" }]);
  });

  test("three or more id-like siblings collapse into one pattern with a sample", () => {
    const cache = createObservationCache();
    cache.remember(page("/products", [link("/products/new", "Create product"), link("/products/P-1001", "Mug"), link("/products/P-1002", "Kettle"), link("/products/P-1003", "Beans")]), 1);
    const routes = cache.routes();
    expect(routes).toContainEqual({ path: "/products/:id", name: "Mug", sample: "/products/P-1001" });
    expect(routes).toContainEqual({ path: "/products/new", name: "Create product" });
    expect(routes.filter((route) => route.path.startsWith("/products/P-"))).toHaveLength(0);
  });

  test("extra links from the page count even when the snapshot summarised them away", () => {
    const cache = createObservationCache();
    cache.remember(page("/orders"), 1, [{ href: "/orders/C-1", name: "C-1" }, { href: "/orders/C-2", name: "C-2" }, { href: "/orders/C-3", name: "C-3" }]);
    expect(cache.routes()).toContainEqual({ path: "/orders/:id", name: "C-1", sample: "/orders/C-1" });
  });

  test("many siblings without ids collapse too, few stay separate", () => {
    const cache = createObservationCache();
    const guides = ["a", "b", "c", "d", "e", "f"].map((slug) => link(`/guides/${slug}`, slug));
    cache.remember(page("/", [...guides, link("/docs/x"), link("/docs/y"), link("/docs/z")]), 1);
    const paths = cache.routes().map((route) => route.path);
    expect(paths).toContain("/guides/:id");
    expect(paths.filter((path) => path.startsWith("/guides/") && path !== "/guides/:id")).toHaveLength(0);
    expect(paths.filter((path) => path.startsWith("/docs/"))).toHaveLength(3);
  });

  test("two siblings stay separate", () => {
    const cache = createObservationCache();
    cache.remember(page("/", [link("/orders/C-1", "C-1"), link("/orders/C-2", "C-2")]), 1);
    expect(cache.routes().map((route) => route.path)).toEqual(["/", "/orders/C-1", "/orders/C-2"]);
  });

  test("observed pages come first and the list is capped", () => {
    const cache = createObservationCache();
    const links = Array.from({ length: 60 }, (_, index) => link(`/page-${String.fromCharCode(97 + (index % 26))}${index}`, `Page ${index}`));
    cache.remember(page("/", links), 1);
    cache.remember(page("/settings"), 2);
    const routes = cache.routes();
    expect(routes).toHaveLength(ROUTE_LIMIT);
    expect(routes.slice(0, 2).map((route) => route.path)).toEqual(["/", "/settings"]);
  });

  test("subscribe fires on remember and clear", () => {
    const cache = createObservationCache();
    let fired = 0;
    const stop = cache.subscribe(() => {
      fired += 1;
    });
    cache.remember(page("/"), 1);
    cache.clear();
    stop();
    cache.remember(page("/"), 2);
    expect(fired).toBe(2);
    expect(cache.observed()).toEqual(["/"]);
  });
});
