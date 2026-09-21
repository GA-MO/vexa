import { afterEach, describe, expect, test } from "bun:test";
import { ADMIN_TOOLS } from "./names";
import { createResolver } from "./resolve";
import type { RunResult } from "./run";
import type { Step } from "./schema";
import { createAdminTools, describeSteps, isMutatingStep, type AdminConfirmPolicy, type AdminToolDeps, type DiscoverOutcome, type DiscoverRequest } from "./tools";

const DESCRIPTION_LIMIT = 300;

const PAGE = `
  <form aria-label="Create product">
    <label>Name<input name="name" /></label>
    <label>Category<select name="category"><option value="cases">Cases</option><option value="cables">Cables</option></select></label>
    <button type="submit">Save product</button>
    <button type="button">Preview</button>
  </form>
  <button type="button">Delete product</button>
  <div role="dialog" aria-label="Confirm"><button type="button">Yes</button></div>
`;

type Harness = {
  root: HTMLElement;
  tools: ReturnType<typeof createAdminTools>;
  confirmations: Step[][];
  navigations: string[];
  discoveries: DiscoverRequest[];
};

type HarnessOptions = { approve?: boolean; policy?: AdminConfirmPolicy; navigate?: boolean; discover?: DiscoverOutcome };

function harness(html: string, options: HarnessOptions = {}): Harness {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  const confirmations: Step[][] = [];
  const navigations: string[] = [];
  const discoveries: DiscoverRequest[] = [];
  let path = "/products/new";
  const outcome = options.discover;
  const deps: AdminToolDeps = {
    discover: outcome
      ? async (request) => {
          discoveries.push(request);
          return outcome;
        }
      : undefined,
    root: () => root,
    page: () => ({ path, title: "New product" }),
    resolver: createResolver(),
    confirm: async (steps) => {
      confirmations.push(steps);
      return options.approve ?? true;
    },
    options: () => ({
      confirm: options.policy,
      navigate: options.navigate
        ? (next) => {
            navigations.push(next);
            path = next;
          }
        : undefined,
    }),
  };
  return { root, tools: createAdminTools(deps), confirmations, navigations, discoveries };
}

function element(root: ParentNode, selector: string): Element {
  const found = root.querySelector(selector);
  if (!found) throw new Error(`no element for ${selector}`);
  return found;
}

const MODEL = { toolCallId: "call-1", source: "model" as const };
const BUTTON = { toolCallId: null, source: "button" as const };

afterEach(() => {
  document.body.innerHTML = "";
});

describe("descriptions", () => {
  test("every tool fits the host tool description limit", () => {
    const { tools } = harness("", { discover: { ok: true, progress: { status: "done", visited: [], pending: 0, errors: [] } } });
    for (const tool of Object.values(tools)) expect(tool.description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    expect(Object.keys(tools)).toEqual([ADMIN_TOOLS.observe, ADMIN_TOOLS.run, ADMIN_TOOLS.discover]);
  });
});

const DONE = { status: "done" as const, visited: ["/products/new", "/products"], pending: 0, errors: [] };

describe("admin_discover", () => {
  test("refuses to run from a button", async () => {
    const { tools, discoveries } = harness(PAGE, { discover: { ok: true, progress: DONE } });
    const result = await tools.admin_discover.run({}, BUTTON);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain("ACTION_NOT_ALLOWED");
    expect(discoveries).toHaveLength(0);
  });

  test("returns routes, observed and the pages it looked at", async () => {
    const { tools, discoveries } = harness(PAGE, { discover: { ok: true, progress: DONE } });
    const result = await tools.admin_discover.run({ limit: 5 }, MODEL);
    expect(result.ok).toBe(true);
    expect(discoveries).toEqual([{ limit: 5 }]);
    expect(result.ok && result.summary).toBe("2 pages looked at");
    expect(result.ok && (result.data as { visited: string[] }).visited).toEqual(DONE.visited);
    expect(result.ok && (result.data as { routes: unknown[] }).routes).toBeInstanceOf(Array);
  });

  test("a fresh result answers cached without looking again", async () => {
    const { tools } = harness(PAGE, { discover: { ok: true, cached: true, progress: DONE } });
    const result = await tools.admin_discover.run({}, MODEL);
    expect(result.ok && (result.data as { cached?: true }).cached).toBe(true);
    expect(result.ok && result.summary).toMatch(/pages known$/);
  });

  test("a blocked frame is DISCOVERY_UNAVAILABLE with the reason and the known routes", async () => {
    const { tools } = harness(PAGE, { discover: { ok: false, detail: "/products/new redirected to /login" } });
    const result = await tools.admin_discover.run({}, MODEL);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBe("DISCOVERY_UNAVAILABLE: /products/new redirected to /login");
    expect(result.ok === false && (result.data as { routes: unknown[] }).routes).toBeInstanceOf(Array);
  });

  test("without a discover dependency the tool does not exist", () => {
    const { tools } = harness(PAGE);
    expect(tools.admin_discover).toBeUndefined();
  });
});

describe("admin_run from a button", () => {
  test("is refused and touches nothing", async () => {
    const { tools, root, confirmations } = harness(PAGE);
    const result = await tools.admin_run.run({ steps: [{ action: "fill", target: { role: "textbox", name: "Name" }, value: "Case" }] }, BUTTON);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toStartWith("ACTION_NOT_ALLOWED");
    expect((element(root, "input[name=name]") as HTMLInputElement).value).toBe("");
    expect(confirmations).toHaveLength(0);
  });
});

describe("admin_observe", () => {
  test("runs from a button and returns the snapshot", async () => {
    const { tools } = harness(PAGE);
    const result = await tools.admin_observe.run({}, BUTTON);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as { path: string; elements: Array<{ role: string; name?: string }> };
    expect(data.path).toBe("/products/new");
    expect(data.elements.some((item) => item.role === "textbox" && item.name === "Name")).toBe(true);
  });
});

describe("default confirm policy", () => {
  const { root } = harness(PAGE);
  const cases: Array<[string, Step, Element | null, boolean]> = [
    ["submit", { action: "submit", target: "f1" }, element(root, "form"), true],
    ["click inside a dialog", { action: "click", target: "b1" }, element(root, "[role=dialog] button"), true],
    ["click a destructive name", { action: "click", target: "b1" }, element(root, "form ~ button"), true],
    ["click a submit button", { action: "click", target: "b1" }, element(root, "button[type=submit]"), true],
    ["click a plain button", { action: "click", target: "b1" }, element(root, "button[type=button]"), false],
    ["fill", { action: "fill", target: "i1", value: "x" }, element(root, "input"), false],
    ["select", { action: "select", target: "s1", value: "cables" }, element(root, "select"), false],
    ["navigate", { action: "navigate", to: "/orders" }, null, false],
  ];
  for (const [label, step, target, expected] of cases) {
    test(`${label} → ${expected}`, () => {
      expect(isMutatingStep(step, target)).toBe(expected);
    });
  }
});

describe("the default policy is page", () => {
  test("a submit runs without a Vexa confirmation", async () => {
    const { tools, confirmations, root } = harness(PAGE);
    let submitted = false;
    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
    });
    const result = await tools.admin_run.run(
      {
        steps: [
          { action: "fill", target: { role: "textbox", name: "Name" }, value: "Case" },
          { action: "submit", target: { role: "form", name: "Create product" } },
        ],
      },
      MODEL,
    );
    expect(result.ok).toBe(true);
    expect(confirmations).toHaveLength(0);
    expect(submitted).toBe(true);
  });

  test("a click inside the page's confirmation dialog is refused", async () => {
    const { tools, confirmations } = harness(PAGE);
    const result = await tools.admin_run.run({ steps: [{ action: "click", target: { role: "button", name: "Yes" } }] }, MODEL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toStartWith("ACTION_NOT_ALLOWED at step 1");
    expect(confirmations).toHaveLength(0);
  });

  test("a stopped run summarises the steps left for the user", async () => {
    const { tools, root } = harness('<button type="button" id="open">Delete product</button><div id="slot"></div>');
    root.querySelector("#open")?.addEventListener("click", () => {
      const slot = root.querySelector("#slot");
      if (slot) slot.innerHTML = '<div role="alertdialog" aria-label="Delete?"><button type="button">Cancel</button><button type="button">Delete</button></div>';
    });
    const result = await tools.admin_run.run(
      {
        steps: [
          { action: "click", target: { role: "button", name: "Delete product" } },
          { action: "click", target: { role: "button", name: "Delete" } },
        ],
      },
      MODEL,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toBe("Stopped: the page is asking the user to confirm (1 steps not run)");
    expect((result.data as RunResult).stopped).toBe("confirmation");
  });
});

describe("policies through admin_run", () => {
  const fillOnly = { steps: [{ action: "fill", target: { role: "textbox", name: "Name" }, value: "Case" }] as Step[] };
  const submitPlan = {
    steps: [
      { action: "fill", target: { role: "textbox", name: "Name" }, value: "Case" },
      { action: "submit", target: { role: "form", name: "Create product" } },
    ] as Step[],
  };

  test('"all" confirms even a fill', async () => {
    const { tools, confirmations } = harness(PAGE, { policy: "all" });
    await tools.admin_run.run(fillOnly, MODEL);
    expect(confirmations).toHaveLength(1);
  });

  test('"none" never confirms a submit', async () => {
    const { tools, confirmations } = harness(PAGE, { policy: "none" });
    const result = await tools.admin_run.run(submitPlan, MODEL);
    expect(result.ok).toBe(true);
    expect(confirmations).toHaveLength(0);
  });

  test("confirm receives the remaining steps once", async () => {
    const { tools, confirmations } = harness(PAGE, { policy: "mutating" });
    await tools.admin_run.run(submitPlan, MODEL);
    expect(confirmations).toHaveLength(1);
    expect(confirmations[0].map((step) => step.action)).toEqual(["submit"]);
  });

  test("declined → DECLINED with the trace in data", async () => {
    const { tools, root } = harness(PAGE, { approve: false, policy: "mutating" });
    const result = await tools.admin_run.run(submitPlan, MODEL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toStartWith("DECLINED at step 2");
    const data = result.data as RunResult;
    expect(data.trace.map((item) => item.ok)).toEqual([true, false]);
    expect((element(root, "input[name=name]") as HTMLInputElement).value).toBe("Case");
  });

  test("success returns a summary and the run result", async () => {
    const { tools } = harness(PAGE);
    const result = await tools.admin_run.run(fillOnly, MODEL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toBe("1 of 1 steps done on /products/new");
    expect((result.data as RunResult).page.path).toBe("/products/new");
  });
});

describe("admin_observe with a path", () => {
  test("the current path is observed live and lists routes and observed pages", async () => {
    const { tools } = harness(`${PAGE}<a href="/orders">Orders</a>`);
    const result = await tools.admin_observe.run({ path: "/products/new" }, MODEL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as { cached?: boolean; routes: Array<{ path: string }>; observed: string[] };
    expect(data.cached).toBeUndefined();
    expect(data.observed).toEqual(["/products/new"]);
    expect(data.routes.map((route) => route.path)).toEqual(["/products/new", "/orders"]);
  });

  test("a visited path answers from memory with cached and observedAt", async () => {
    const { tools, navigations } = harness(PAGE, { navigate: true });
    await tools.admin_observe.run({}, MODEL);
    await tools.admin_run.run({ steps: [{ action: "navigate", to: "/orders" }] }, MODEL);
    expect(navigations).toEqual(["/orders"]);
    const result = await tools.admin_observe.run({ path: "/products/new" }, MODEL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as { cached?: boolean; observedAt?: string; path: string; observed: string[] };
    expect(data.cached).toBe(true);
    expect(data.path).toBe("/products/new");
    expect(typeof data.observedAt).toBe("string");
    expect(data.observed).toEqual(["/products/new", "/orders"]);
  });

  test("an unvisited path is PAGE_NOT_OBSERVED with the known routes", async () => {
    const { tools } = harness(`${PAGE}<a href="/orders">Orders</a>`);
    await tools.admin_observe.run({}, MODEL);
    const result = await tools.admin_observe.run({ path: "/orders" }, MODEL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toStartWith("PAGE_NOT_OBSERVED: /orders");
    expect((result.data as { routes: Array<{ path: string }> }).routes.map((route) => route.path)).toContain("/orders");
  });

  test("a navigate step carries the arrived page in its trace item", async () => {
    const { tools } = harness(PAGE, { navigate: true });
    const result = await tools.admin_run.run({ steps: [{ action: "navigate", to: "/orders" }] }, MODEL);
    expect(result.ok).toBe(true);
    const data = result.data as { trace: Array<{ page?: { path: string } }>; routes: unknown[]; observed: string[] };
    expect(data.trace[0].page?.path).toBe("/orders");
    expect(data.observed).toContain("/orders");
    expect(Array.isArray(data.routes)).toBe(true);
  });
});

describe("navigation", () => {
  test("without a navigate option a path with no link is ROUTE_NOT_FOUND", async () => {
    const { tools } = harness(PAGE);
    const result = await tools.admin_run.run({ steps: [{ action: "navigate", to: "/orders" }] }, MODEL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toStartWith("ROUTE_NOT_FOUND");
  });

  test("with a navigate option the host routes", async () => {
    const { tools, navigations } = harness(PAGE, { navigate: true });
    await tools.admin_run.run({ steps: [{ action: "navigate", to: "/orders" }] }, MODEL);
    expect(navigations).toEqual(["/orders"]);
  });
});

describe("describeSteps", () => {
  test("turns steps into sentences", () => {
    const sentences = describeSteps([
      { action: "navigate", to: "/orders" },
      { action: "click", target: { role: "button", name: "Delete" } },
      { action: "fill", target: { role: "textbox", name: "Title" }, value: "Summer Campaign" },
      { action: "select", target: { role: "combobox", name: "Status" }, value: "draft" },
      { action: "check", target: { role: "checkbox", name: "Featured" }, checked: false },
      { action: "submit", target: { role: "form", name: "Create product" } },
      { action: "read", target: "t3" },
      { action: "wait", for: "idle" },
    ]);
    expect(sentences).toEqual([
      "Open /orders",
      "Click Delete",
      'Fill Title with "Summer Campaign"',
      "Select draft in Status",
      "Uncheck Featured",
      "Submit Create product",
      "Read the selected element t3",
      "Wait for the page to settle",
    ]);
  });
});
