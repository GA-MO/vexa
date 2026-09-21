import { afterEach, describe, expect, test } from "bun:test";
import { createObservationCache } from "./cache";
import { watchPages } from "./passive";

const QUIET_MS = 20;
const SETTLE_MS = 60;

const mounted: HTMLElement[] = [];

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  mounted.push(root);
  return root;
}

function settle() {
  return new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
}

function currentPage() {
  return { path: location.pathname, title: document.title };
}

afterEach(() => {
  for (const root of mounted.splice(0)) root.remove();
  history.replaceState({}, "", "/");
});

describe("watchPages", () => {
  test("remembers the current page once and every page the route changes to", async () => {
    const root = mount("<h1>Home</h1><a href='/orders'>Orders</a>");
    const cache = createObservationCache();
    const stop = watchPages({ root: () => root, page: currentPage, cache, wait: { quietMs: QUIET_MS } });
    await settle();
    expect(cache.observed()).toEqual(["/"]);

    history.pushState({}, "", "/orders");
    root.innerHTML = "<h1>Orders</h1><table><tr><th>Order</th></tr><tr><td>C-1</td></tr></table>";
    await settle();
    expect(cache.observed()).toEqual(["/", "/orders"]);
    expect(cache.get("/orders")?.elements.some((el) => el.role === "table")).toBe(true);
    expect(cache.routes().some((route) => route.path === "/orders" && route.name === "Orders")).toBe(true);
    stop();
  });

  test("a DOM change without a route change adds nothing", async () => {
    const root = mount("<h1>Home</h1>");
    const cache = createObservationCache();
    const stop = watchPages({ root: () => root, page: currentPage, cache, wait: { quietMs: QUIET_MS } });
    await settle();
    const before = cache.get("/")?.observedAt;
    root.innerHTML = "<h1>Home</h1><button>Later</button>";
    await settle();
    expect(cache.observed()).toEqual(["/"]);
    expect(cache.get("/")?.observedAt).toBe(before);
    stop();
  });

  test("after stop, route changes are ignored", async () => {
    const root = mount("<h1>Home</h1>");
    const cache = createObservationCache();
    const stop = watchPages({ root: () => root, page: currentPage, cache, wait: { quietMs: QUIET_MS } });
    await settle();
    stop();
    history.pushState({}, "", "/settings");
    root.innerHTML = "<h1>Settings</h1>";
    await settle();
    expect(cache.observed()).toEqual(["/"]);
  });
});
