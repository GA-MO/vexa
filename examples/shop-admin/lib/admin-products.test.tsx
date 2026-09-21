import { afterEach, describe, expect, test } from "bun:test";
import { createDomPageHost, type DomPageHost } from "@/lib/scenarios/dom-host";
import type { HeadlessToolFn } from "@/lib/scenarios/types";
import type { RunResult } from "vexa/admin";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });

const hosts: DomPageHost[] = [];

async function host(path: string, approve = true): Promise<DomPageHost> {
  const created = await createDomPageHost(path, { confirm: async () => approve, confirmPolicy: "mutating" });
  hosts.push(created);
  return created;
}

function runOf(page: DomPageHost): HeadlessToolFn {
  const tool = page.tools.admin_run;
  return typeof tool === "function" ? tool : tool.run;
}

async function runPlan(page: DomPageHost, steps: unknown[]): Promise<RunResult> {
  const result = await runOf(page)({ steps });
  return (result as { data: RunResult }).data;
}

afterEach(async () => {
  for (const page of hosts.splice(0)) await page.dispose();
});

const DELETE_STEPS = [
  { action: "click", target: { role: "button", name: "Delete product" } },
  { action: "click", target: { role: "button", name: "Delete", within: { role: "alertdialog", name: "/^Delete/" } } },
];

describe("what the scenarios cannot assert about the products pages", () => {
  test("select on the base-ui Category combobox opens its listbox and commits the option into the trigger", async () => {
    const page = await host("/products/new");
    const doc = page.container.ownerDocument;
    const trigger = doc.querySelector<HTMLElement>('[role="combobox"][aria-labelledby]');
    expect(trigger).not.toBeNull();
    const before = trigger?.textContent;
    const result = await runPlan(page, [{ action: "select", target: { role: "combobox", name: "Category" }, value: "Equipment" }]);
    expect(result.trace[0]).toMatchObject({ action: "select", ok: true });
    expect(doc.querySelector('[role="listbox"]:not([aria-hidden="true"])')?.getAttribute("aria-expanded") ?? null).toBeNull();
    expect(trigger?.textContent).toContain("Equipment");
    expect(trigger?.textContent).not.toBe(before);
  });

  test("mutating policy, approved: Vexa asks once, then the plan drives the app's own dialog to the end", async () => {
    const page = await host("/products/P-1006");
    const result = await runPlan(page, DELETE_STEPS);
    expect(result.ok).toBe(true);
    expect(result.trace.map((item) => item.ok)).toEqual([true, true]);
    expect(result.stopped).toBeUndefined();
    expect(page.page().path).toBe("/products");
    expect(page.container.textContent).toContain("Deleted Espresso tamper");
    expect(page.container.textContent).not.toContain("EQ-TMP");
  });
});
