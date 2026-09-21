import { afterEach, describe, expect, test } from "bun:test";
import { createDomPageHost, type DomPageHost } from "@/lib/scenarios/dom-host";
import type { HeadlessToolFn } from "@/lib/scenarios/types";
import type { ObserveResult } from "vexa/admin";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });

const hosts: DomPageHost[] = [];

async function host(path: string): Promise<DomPageHost> {
  const created = await createDomPageHost(path);
  hosts.push(created);
  return created;
}

function observeOf(page: DomPageHost): HeadlessToolFn {
  const tool = page.tools.admin_observe;
  return typeof tool === "function" ? tool : tool.run;
}

async function observe(page: DomPageHost, path?: string): Promise<{ ok: boolean; data?: ObserveResult; error?: string }> {
  return (await observeOf(page)(path ? { path } : {})) as { ok: boolean; data?: ObserveResult; error?: string };
}

afterEach(async () => {
  for (const page of hosts.splice(0)) await page.dispose();
});

describe("discovery over the real shop-admin pages (what the scenarios cannot assert)", () => {
  test("visits one sample per dynamic route, collapses them in routes, ends on the start page and leaves the store alone", async () => {
    const page = await host("/settings");
    const progress = await page.discover();
    expect(progress.status).toBe("done");
    expect(progress.errors).toEqual([]);
    expect(progress.visited.filter((path) => /^\/orders\/C-/.test(path))).toHaveLength(1);
    expect(progress.visited.filter((path) => /^\/products\/P-/.test(path))).toHaveLength(1);
    expect(page.page().path).toBe("/settings");
    const result = await observe(page);
    const routes = result.data?.routes.map((route) => route.path) ?? [];
    expect(routes).toContain("/orders/:id");
    expect(routes).toContain("/products/:id");
    expect(routes.filter((path) => /^\/orders\/C-/.test(path))).toHaveLength(0);
    const locale = result.data?.elements.find((element) => element.role === "combobox" && element.name === "Locale");
    expect(locale?.value).toBe("en-US");
  });

  test("a limit stops discovery early and an unvisited page is PAGE_NOT_OBSERVED", async () => {
    const page = await host("/settings");
    const progress = await page.discover({ limit: 2 });
    expect(progress.visited).toHaveLength(2);
    expect(progress.pending).toBeGreaterThan(0);
    const missing = progress.visited.includes("/products/new") ? "/orders" : "/products/new";
    const result = await observe(page, missing);
    expect(result.ok).toBe(false);
    expect(result.error).toStartWith("PAGE_NOT_OBSERVED");
  });
});
