import { afterEach, describe, expect, test } from "bun:test";
import { createResolver } from "./resolve";
import { runPlan, type NavigateOutcome, type RunDeps } from "./run";
import type { Step } from "./schema";
import { snapshot } from "./snapshot";
import { waitForIdle } from "./wait";

const FAST_WAIT = { quietMs: 20, timeoutMs: 200, pollMs: 5 };

type Harness = {
  root: HTMLElement;
  deps: RunDeps;
  confirmations: Step[][];
  navigations: string[];
  setPath(path: string): void;
};

type HarnessOptions = {
  approve?: boolean;
  navigate?: NavigateOutcome;
  mutating?: Step["action"][];
  pageConfirms?: boolean;
};

const DEFAULT_MUTATING: Step["action"][] = ["submit"];

function harness(html: string, options: HarnessOptions = {}): Harness {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  let path = "/start";
  const resolver = createResolver();
  resolver.remember(snapshot(root, { path, title: "Start" }));
  const confirmations: Step[][] = [];
  const navigations: string[] = [];
  const mutating = new Set(options.mutating ?? DEFAULT_MUTATING);
  const deps: RunDeps = {
    root,
    resolver,
    navigate: async (to) => {
      navigations.push(to);
      const outcome = options.navigate ?? { ok: false };
      if (outcome.ok && outcome.mode === "router") path = to;
      return outcome;
    },
    confirm: async (steps) => {
      confirmations.push(steps);
      return options.approve ?? true;
    },
    isMutating: (step) => mutating.has(step.action),
    pageConfirms: options.pageConfirms,
    page: () => ({ path, title: "Start" }),
    now: () => Date.now(),
    wait: FAST_WAIT,
  };
  return { root, deps, confirmations, navigations, setPath: (next) => (path = next) };
}

const FORM = `
  <form aria-label="Create product">
    <label>Name<input name="name" required /></label>
    <label>Category<select name="category"><option value="cases">Cases</option><option value="cables">Cables</option></select></label>
    <label><input type="checkbox" name="active" />Active</label>
    <button type="submit">Save</button>
  </form>`;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("plan execution", () => {
  test("fill, select, check, click and submit produce an ok trace and a fresh snapshot", async () => {
    const { root, deps } = harness(FORM);
    let submitted = false;
    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
    });
    const result = await runPlan(
      {
        steps: [
          { action: "fill", target: { role: "textbox", name: "Name" }, value: "iPhone Case" },
          { action: "select", target: { role: "combobox", name: "Category" }, value: "Cables" },
          { action: "check", target: { role: "checkbox", name: "Active" }, checked: true },
          { action: "submit", target: { role: "button", name: "Save" } },
        ],
      },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(result.trace.map((item) => [item.action, item.ok, item.summary])).toEqual([
      ["fill", true, 'Filled with "iPhone Case"'],
      ["select", true, 'Selected "Cables"'],
      ["check", true, "Checked"],
      ["submit", true, "Submitted"],
    ]);
    expect(submitted).toBe(true);
    expect(result.page.elements.find((el) => el.role === "textbox")?.value).toBe("iPhone Case");
    expect(result.trace.every((item) => typeof item.ms === "number")).toBe(true);
  });

  test("the plan stops at the first failure and later steps do not run", async () => {
    const { root, deps } = harness(FORM);
    const result = await runPlan(
      {
        steps: [
          { action: "click", target: { role: "button", name: "Missing" } },
          { action: "fill", target: { role: "textbox", name: "Name" }, value: "never" },
        ],
      },
      deps,
    );
    expect(result.ok).toBe(false);
    expect(result.trace).toHaveLength(1);
    expect(result.trace[0]).toMatchObject({ action: "click", ok: false, error: "TARGET_NOT_FOUND" });
    expect(root.querySelector<HTMLInputElement>("input[name=name]")?.value).toBe("");
  });

  test("a malformed plan is PLAN_INVALID with the issue path", async () => {
    const { deps } = harness(FORM);
    const result = await runPlan({ steps: [{ action: "fill", target: "b1" }] }, deps);
    expect(result.ok).toBe(false);
    expect(result.trace[0]).toMatchObject({ action: "plan", error: "PLAN_INVALID", detail: "steps.0.value: fill needs target and value" });
    const strings = await runPlan({ steps: ["click b1"] }, deps);
    expect(strings.trace[0].detail).toBe('steps.0: must be an object like {"action":"click","target":"b4"}, not a string');
    expect(result.page.path).toBe("/start");
  });

  test("an empty or oversized plan is PLAN_INVALID", async () => {
    const { deps } = harness(FORM);
    expect((await runPlan({ steps: [] }, deps)).trace[0].error).toBe("PLAN_INVALID");
    const steps = Array.from({ length: 21 }, () => ({ action: "wait", for: "idle" }));
    expect((await runPlan({ steps }, deps)).trace[0].error).toBe("PLAN_INVALID");
  });
});

describe("confirmation", () => {
  test("confirm is asked once, before the first mutating step, with the remaining steps", async () => {
    const { deps, confirmations } = harness(FORM);
    await runPlan(
      {
        steps: [
          { action: "fill", target: { role: "textbox", name: "Name" }, value: "A" },
          { action: "submit", target: { role: "button", name: "Save" } },
          { action: "read", target: { role: "textbox", name: "Name" } },
        ],
      },
      deps,
    );
    expect(confirmations).toHaveLength(1);
    expect(confirmations[0].map((step) => step.action)).toEqual(["submit", "read"]);
  });

  test("a declined confirmation stops with DECLINED; earlier steps stay applied, nothing after runs", async () => {
    const { root, deps } = harness(FORM, { approve: false });
    let submitted = false;
    root.querySelector("form")?.addEventListener("submit", () => (submitted = true));
    const result = await runPlan(
      {
        steps: [
          { action: "fill", target: { role: "textbox", name: "Name" }, value: "Kept" },
          { action: "submit", target: { role: "button", name: "Save" } },
          { action: "check", target: { role: "checkbox", name: "Active" }, checked: true },
        ],
      },
      deps,
    );
    expect(result.ok).toBe(false);
    expect(result.trace.map((item) => [item.action, item.ok, item.error])).toEqual([
      ["fill", true, undefined],
      ["submit", false, "DECLINED"],
    ]);
    expect(submitted).toBe(false);
    expect(root.querySelector<HTMLInputElement>("input[name=name]")?.value).toBe("Kept");
    expect(root.querySelector<HTMLInputElement>("input[name=active]")?.checked).toBe(false);
  });

  test("a plan without mutating steps never asks", async () => {
    const { deps, confirmations } = harness(FORM);
    await runPlan({ steps: [{ action: "fill", target: { role: "textbox", name: "Name" }, value: "A" }] }, deps);
    expect(confirmations).toHaveLength(0);
  });
});

const DELETE_PAGE = `
  <h1>Kettle</h1>
  <button type="button" id="open">Delete product</button>
  <div id="dialog-slot"></div>`;

const DELETE_DIALOG = '<div role="alertdialog" aria-label="Delete kettle?"><p>This cannot be undone.</p><button type="button">Cancel</button><button type="button" id="confirm">Delete</button></div>';

function withAppDialog(root: HTMLElement) {
  let deleted = false;
  root.querySelector("#open")?.addEventListener("click", () => {
    const slot = root.querySelector("#dialog-slot");
    if (slot) slot.innerHTML = DELETE_DIALOG;
    root.querySelector("#confirm")?.addEventListener("click", () => {
      deleted = true;
      if (slot) slot.innerHTML = "";
    });
  });
  return () => deleted;
}

describe("the app's own confirmation dialog", () => {
  const openThenConfirm = {
    steps: [
      { action: "click", target: { role: "button", name: "Delete product" } },
      { action: "click", target: { role: "button", name: "Delete" } },
      { action: "wait", for: "idle" },
    ],
  };

  test("page policy: a click that opens it stops the run with the remaining steps, nothing is confirmed by Vexa", async () => {
    const { root, deps, confirmations } = harness(DELETE_PAGE, { pageConfirms: true, mutating: ["click"] });
    const wasDeleted = withAppDialog(root);
    const result = await runPlan(openThenConfirm, deps);
    expect(result.ok).toBe(true);
    expect(result.stopped).toBe("confirmation");
    expect(result.trace.map((item) => [item.action, item.ok, item.opened])).toEqual([["click", true, "confirmation"]]);
    expect(result.remaining?.map((step) => step.action)).toEqual(["click", "wait"]);
    expect(result.page.elements.some((el) => el.role === "alertdialog")).toBe(true);
    expect(confirmations).toHaveLength(0);
    expect(wasDeleted()).toBe(false);
  });

  test("page policy: a later click inside the dialog is refused and the dialog stays for the user", async () => {
    const { root, deps } = harness(DELETE_PAGE, { pageConfirms: true });
    const wasDeleted = withAppDialog(root);
    await runPlan({ steps: [{ action: "click", target: { role: "button", name: "Delete product" } }] }, deps);
    const result = await runPlan({ steps: [{ action: "click", target: { role: "button", name: "Delete" } }] }, deps);
    expect(result.ok).toBe(false);
    expect(result.trace[0]).toMatchObject({ action: "click", ok: false, error: "ACTION_NOT_ALLOWED" });
    expect(result.trace[0].detail).toContain("the user decides in the dialog");
    expect(wasDeleted()).toBe(false);
    expect(root.querySelector("[role=alertdialog]")).not.toBeNull();
  });

  test("page policy: reading inside the dialog is refused too", async () => {
    const { root, deps } = harness(`${DELETE_PAGE}<div role="alertdialog" aria-label="Sure?"><button>Cancel</button><button>Delete</button></div>`, { pageConfirms: true });
    withAppDialog(root);
    const result = await runPlan({ steps: [{ action: "read", target: { role: "button", name: "Cancel" } }] }, deps);
    expect(result.trace[0].error).toBe("ACTION_NOT_ALLOWED");
  });

  test("mutating policy: Vexa asks first, then the model may press the dialog's button", async () => {
    const { root, deps, confirmations } = harness(DELETE_PAGE, { mutating: ["click"] });
    const wasDeleted = withAppDialog(root);
    const result = await runPlan(openThenConfirm, deps);
    expect(confirmations).toHaveLength(1);
    expect(result.stopped).toBeUndefined();
    expect(result.trace.map((item) => item.ok)).toEqual([true, true, true]);
    expect(result.trace[0].opened).toBe("confirmation");
    expect(wasDeleted()).toBe(true);
  });

  test("none policy: presses through the dialog without asking anyone", async () => {
    const { root, deps, confirmations } = harness(DELETE_PAGE, { mutating: [] });
    const wasDeleted = withAppDialog(root);
    const result = await runPlan(openThenConfirm, deps);
    expect(confirmations).toHaveLength(0);
    expect(result.ok).toBe(true);
    expect(wasDeleted()).toBe(true);
  });

  test("page policy: a dialog with inputs is a form and the run continues", async () => {
    const { root, deps } = harness('<button type="button" id="open">Rename</button><div id="dialog-slot"></div>', { pageConfirms: true });
    root.querySelector("#open")?.addEventListener("click", () => {
      const slot = root.querySelector("#dialog-slot");
      if (slot) slot.innerHTML = '<div role="dialog" aria-label="Rename"><label>Name<input /></label><button type="button">Save</button></div>';
    });
    const result = await runPlan(
      {
        steps: [
          { action: "click", target: { role: "button", name: "Rename" } },
          { action: "fill", target: { role: "textbox", name: "Name" }, value: "New" },
        ],
      },
      deps,
    );
    expect(result.stopped).toBeUndefined();
    expect(result.trace.map((item) => item.ok)).toEqual([true, true]);
  });
});

describe("resolution errors in the trace", () => {
  test("TARGET_AMBIGUOUS carries candidates", async () => {
    const { deps } = harness('<div role="group" aria-label="Top"><button>Open</button></div><button>Open</button>');
    const result = await runPlan({ steps: [{ action: "click", target: { role: "button", name: "Open" } }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: false, error: "TARGET_AMBIGUOUS" });
    expect(result.trace[0].candidates).toEqual([
      { ref: "b2", name: "Open", within: "Top" },
      { ref: "b3", name: "Open" },
    ]);
  });

  test("a stale ref is TARGET_STALE", async () => {
    const { root, deps } = harness("<button>Once</button>");
    root.querySelector("button")?.remove();
    const result = await runPlan({ steps: [{ action: "click", target: "b1" }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: false, error: "TARGET_STALE" });
  });
});

describe("read", () => {
  test("read on a password field is refused without exposing the value", async () => {
    const { deps } = harness('<label>Password<input type="password" value="hunter2" /></label>');
    const result = await runPlan({ steps: [{ action: "read", target: { role: "textbox", name: "Password" } }] }, deps);
    expect(result.ok).toBe(false);
    expect(result.trace[0].error).toBe("ACTION_NOT_ALLOWED");
    expect(JSON.stringify(result)).not.toContain("hunter2");
  });

  test("read on a table returns its rows", async () => {
    const { deps } = harness("<table><tr><th>Id</th><th>Name</th></tr><tr><td>1</td><td>Case</td></tr><tr><td>2</td><td>Cable</td></tr></table>");
    const result = await runPlan({ steps: [{ action: "read", target: "t1" }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: true, data: { columns: ["Id", "Name"], rows: [["1", "Case"], ["2", "Cable"]] } });
  });

  test("read on a field returns its value", async () => {
    const { deps } = harness('<label>Name<input value="Jane" /></label>');
    const result = await runPlan({ steps: [{ action: "read", target: { role: "textbox", name: "Name" } }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: true, data: "Jane" });
  });
});

describe("navigate", () => {
  test("clicks a link on the page whose href is the path and waits for the path to change", async () => {
    const { root, deps, setPath, navigations } = harness('<a href="/orders">Orders</a>');
    root.querySelector("a")?.addEventListener("click", (event) => {
      event.preventDefault();
      setTimeout(() => setPath("/orders"), 10);
    });
    const result = await runPlan({ steps: [{ action: "navigate", to: "/orders" }] }, deps);
    expect(result.trace[0]).toMatchObject({ action: "navigate", to: "/orders", ok: true, mode: "router" });
    expect(navigations).toHaveLength(0);
    expect(result.page.path).toBe("/orders");
  });

  test("a click on a link to another path waits for the navigation and carries the arrived page", async () => {
    const { root, deps, setPath } = harness('<a href="/orders/C-1042">C-1042</a><h1>Orders</h1>');
    root.querySelector("a")?.addEventListener("click", (event) => {
      event.preventDefault();
      setTimeout(() => {
        setPath("/orders/C-1042");
        root.innerHTML = '<h1>C-1042</h1><button type="button">Mark paid</button>';
      }, 10);
    });
    const result = await runPlan(
      {
        steps: [
          { action: "click", target: { role: "link", name: "C-1042" } },
          { action: "click", target: { role: "button", name: "Mark paid" } },
        ],
      },
      deps,
    );
    expect(result.trace[0]).toMatchObject({ action: "click", ok: true, mode: "router" });
    expect(result.trace[0].page?.path).toBe("/orders/C-1042");
    expect(result.trace[1]).toMatchObject({ action: "click", ok: true });
  });

  test("a click on a link to the current path or a hash does not wait", async () => {
    const { root, deps } = harness('<a href="/start">Here</a><a href="#top">Top</a>');
    for (const link of Array.from(root.querySelectorAll("a"))) link.addEventListener("click", (event) => event.preventDefault());
    const result = await runPlan(
      {
        steps: [
          { action: "click", target: { role: "link", name: "Here" } },
          { action: "click", target: { role: "link", name: "Top" } },
        ],
      },
      deps,
    );
    expect(result.trace.map((item) => [item.ok, item.mode])).toEqual([
      [true, undefined],
      [true, undefined],
    ]);
  });

  test("a link name instead of a path is resolved by role and name", async () => {
    const { root, deps, setPath } = harness('<a href="/settings">Settings</a>');
    root.querySelector("a")?.addEventListener("click", (event) => {
      event.preventDefault();
      setPath("/settings");
    });
    const result = await runPlan({ steps: [{ action: "navigate", to: "Settings" }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: true, summary: "Opened link Settings" });
  });

  test("falls back to the host router when no link matches", async () => {
    const { deps, navigations } = harness("<p>no links</p>", { navigate: { ok: true, mode: "router" } });
    const result = await runPlan({ steps: [{ action: "navigate", to: "/orders" }] }, deps);
    expect(navigations).toEqual(["/orders"]);
    expect(result.trace[0]).toMatchObject({ ok: true, mode: "router" });
  });

  test("a reload navigation is reported and not awaited", async () => {
    const { deps } = harness("<p>no links</p>", { navigate: { ok: true, mode: "reload" } });
    const result = await runPlan({ steps: [{ action: "navigate", to: "/orders" }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: true, mode: "reload", summary: "Loading /orders" });
  });

  test("ROUTE_NOT_FOUND when neither a link nor the host can route", async () => {
    const { deps } = harness("<p>no links</p>");
    const result = await runPlan({ steps: [{ action: "navigate", to: "/nowhere" }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: false, error: "ROUTE_NOT_FOUND" });
  });

  test("NAVIGATION_TIMEOUT when the path never changes", async () => {
    const { root, deps } = harness('<a href="/orders">Orders</a>');
    root.querySelector("a")?.addEventListener("click", (event) => event.preventDefault());
    const result = await runPlan({ steps: [{ action: "navigate", to: "/orders" }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: false, error: "NAVIGATION_TIMEOUT" });
  });
});

describe("submit outcomes", () => {
  test("FORM_INVALID names the first invalid field and does not submit", async () => {
    const { root, deps } = harness(FORM);
    let submitted = false;
    root.querySelector("form")?.addEventListener("submit", () => (submitted = true));
    const result = await runPlan({ steps: [{ action: "submit", target: { role: "form", name: "Create product" } }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: false, error: "FORM_INVALID", detail: "name" });
    expect(submitted).toBe(false);
  });

  test("SUBMIT_FAILED when the form stays and an alert appears", async () => {
    const { root, deps } = harness(FORM);
    const form = root.querySelector("form")!;
    form.querySelector<HTMLInputElement>("input[name=name]")!.value = "x";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const alert = document.createElement("p");
      alert.setAttribute("role", "alert");
      alert.textContent = "Name is taken";
      form.appendChild(alert);
    });
    const result = await runPlan({ steps: [{ action: "submit", target: { role: "button", name: "Save" } }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: false, error: "SUBMIT_FAILED", detail: "Name is taken" });
  });

  test("a submit that replaces the form is a success even if an alert is elsewhere", async () => {
    const { root, deps } = harness(FORM);
    const form = root.querySelector("form")!;
    form.querySelector<HTMLInputElement>("input[name=name]")!.value = "x";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      root.innerHTML = '<p role="alert">Saved</p>';
    });
    const result = await runPlan({ steps: [{ action: "submit", target: { role: "button", name: "Save" } }] }, deps);
    expect(result.trace[0]).toMatchObject({ ok: true, summary: "Submitted" });
  });
});

describe("waitForIdle", () => {
  test("resolves after the last mutation goes quiet", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const timer = setInterval(() => root.appendChild(document.createElement("span")), 5);
    setTimeout(() => clearInterval(timer), 60);
    const idle = await waitForIdle(root, { quietMs: 30, timeoutMs: 500 });
    expect(idle.settled).toBe(true);
    expect(idle.ms).toBeGreaterThanOrEqual(60);
    expect(root.children.length).toBeGreaterThan(5);
  });

  test("gives up, unsettled, when the page never goes quiet", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const timer = setInterval(() => root.appendChild(document.createElement("span")), 5);
    const idle = await waitForIdle(root, { quietMs: 30, timeoutMs: 100 });
    clearInterval(timer);
    expect(idle.settled).toBe(false);
  });
});
