import { afterEach, describe, expect, test } from "bun:test";
import { createObservationCache } from "./cache";
import { discoverPages } from "./discover";
import { hrefForPath, isRoute, pagePath, routePath } from "./paths";
import { createResolver } from "./resolve";
import { runPlan, type RunDeps } from "./run";
import { collectLinks, currentPage, snapshot } from "./snapshot";

const mounted: HTMLElement[] = [];

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  mounted.push(root);
  return root;
}

afterEach(() => {
  for (const root of mounted.splice(0)) root.remove();
  window.location.hash = "";
});

describe("routes under a hash router", () => {
  test("routePath reads #/x, /#/x and /x alike and rejects everything else", () => {
    expect(routePath("#/orders")).toBe("/orders");
    expect(routePath("/#/orders/12?x=1")).toBe("/orders/12");
    expect(routePath("/orders/")).toBe("/orders");
    expect(routePath("/orders?page=2#top")).toBe("/orders");
    expect(routePath("https://elsewhere.test/x")).toBeNull();
    expect(routePath("//cdn.test")).toBeNull();
    expect(routePath("mailto:a@b.c")).toBeNull();
    expect(isRoute("#/orders")).toBe(true);
    expect(isRoute("Orders")).toBe(false);
  });

  test("pagePath and currentPage prefer the hash route over the pathname", () => {
    expect(pagePath({ pathname: "/", hash: "#/orders" })).toBe("/orders");
    expect(pagePath({ pathname: "/admin/index.html", hash: "#/customers/3" })).toBe("/customers/3");
    expect(pagePath({ pathname: "/products", hash: "#details" })).toBe("/products");
    window.location.hash = "#/reviews";
    expect(currentPage(document).path).toBe("/reviews");
  });

  test("hrefForPath opens a route through the hash when the document routes that way", () => {
    const root = mount('<a href="#/orders">Orders</a>');
    expect(hrefForPath("/orders", document)).toBe(`${document.location.pathname}#/orders`);
    root.remove();
    mounted.splice(0);
    expect(hrefForPath("/orders", document)).toBe("/orders");
  });

  test("the cache keys hash links by their route, including links that carry a menuitem role", () => {
    const cache = createObservationCache();
    const root = mount('<a href="#/orders">Orders</a><a href="#/orders/1">1</a><a href="#/orders/2">2</a><a href="#/orders/3">3</a><a role="menuitem" href="#/reviews">Reviews</a>');
    const capture = snapshot(root, { path: "/", title: "Home" });
    cache.remember(capture.snapshot, Date.now(), collectLinks(root));
    const paths = cache.routes().map((route) => route.path);
    expect(paths).toContain("/orders");
    expect(paths).toContain("/orders/:id");
    expect(paths).toContain("/reviews");
    expect(capture.snapshot.elements.find((element) => element.role === "menuitem")?.href).toBe("#/reviews");
  });

  test("navigate to /orders clicks the #/orders link and waits for the hash route to change", async () => {
    const root = mount('<a href="#/orders" id="link">Orders</a>');
    window.location.hash = "#/";
    root.querySelector("#link")?.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.hash = "#/orders";
    });
    const resolver = createResolver();
    const deps: RunDeps = {
      root,
      resolver,
      navigate: async () => ({ ok: false }),
      confirm: async () => true,
      isMutating: () => false,
      page: () => currentPage(document),
      now: () => Date.now(),
      wait: { quietMs: 20, timeoutMs: 500, pollMs: 5 },
    };
    const result = await runPlan({ steps: [{ action: "navigate", to: "/orders" }] }, deps);
    expect(result.trace[0]).toMatchObject({ action: "navigate", ok: true });
    expect(result.page.path).toBe("/orders");
  });

  test("discovery never stores a page that shows no control", async () => {
    const root = mount('<p>Loading…</p>');
    const cache = createObservationCache();
    const progress = await discoverPages(
      {
        root: () => root,
        page: () => ({ path: "/loading", title: "Loading" }),
        navigate: async () => ({ ok: false }),
        cache,
        resolver: createResolver(),
        wait: { quietMs: 10, timeoutMs: 60, pollMs: 5 },
      },
      { limit: 3 },
    );
    expect(progress.visited).toEqual(["/loading"]);
    expect(cache.observed()).toEqual([]);
  });
});
