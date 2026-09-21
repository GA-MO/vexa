import { afterEach, describe, expect, test } from "bun:test";
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { defineTool, useVexaAdmin, useVexaHost, VexaProvider } from "./host";
import type { AdminPages } from "../admin/seed";

type Mounted = { root: Root; container: HTMLElement };

const mounted: Mounted[] = [];

function AdminProbe() {
  const { enabled, observed, routes, progress } = useVexaAdmin();
  return <output data-testid="admin">{`${enabled}|${observed.join(",")}|${routes.map((route) => route.path).join(",")}|${progress.status}`}</output>;
}

function SchemaProbe() {
  const { tools } = useVexaHost();
  return <output data-testid="schemas">{tools.map((tool) => tool.name).join(",")}</output>;
}

async function mount(element: React.ReactNode): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  await act(async () => {
    await Promise.resolve();
  });
  mounted.push({ root, container });
  return container;
}

function schemaNames(container: HTMLElement) {
  return container.querySelector('[data-testid="schemas"]')?.textContent ?? "";
}

const echo = defineTool({ description: "Echo", run: () => ({ ok: true }) });
const HOST_TOOLS = { echo };
const ADMIN_NO_DISCOVERY = { discover: "off" as const };

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

function RerenderingHost({ renders }: { renders: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count < renders) setCount(count + 1);
  }, [count, renders]);
  return (
    <VexaProvider tools={HOST_TOOLS} admin={{ navigate: () => undefined, confirm: () => true, discover: "off" }}>
      <SchemaProbe />
      <output data-testid="renders">{count}</output>
    </VexaProvider>
  );
}

describe("useVexaAdmin", () => {
  test("outside a provider it is disabled with empty lists", async () => {
    const container = await mount(<AdminProbe />);
    expect(container.querySelector('[data-testid="admin"]')?.textContent).toBe("false|||idle");
  });

  test("with admin on, the passive capture and an observe run fill observed and routes", async () => {
    let run: ((name: string) => Promise<unknown>) | null = null;
    function Runner() {
      const host = useVexaHost();
      run = (name) => host.runTool(name, {});
      return null;
    }
    const container = await mount(
      <VexaProvider admin={ADMIN_NO_DISCOVERY}>
        <a href="/orders">Orders</a>
        <AdminProbe />
        <Runner />
      </VexaProvider>,
    );
    expect(container.querySelector('[data-testid="admin"]')?.textContent).toBe("true|/|/,/orders|idle");
    await act(async () => {
      await run?.("admin_observe");
    });
    expect(container.querySelector('[data-testid="admin"]')?.textContent).toBe("true|/|/,/orders|idle");
  });
});

const SEED: AdminPages = {
  version: 1,
  pages: [
    { path: "/products", title: "Products", elements: [{ ref: "l1", role: "link", name: "Create product", href: "/products/new" }], unnamed: 0 },
    { path: "/orders", title: "Orders", elements: [], unnamed: 0 },
  ],
  links: [],
};

describe("VexaProvider admin pages", () => {
  test("a seed lists its pages as observed and admin_observe answers from it", async () => {
    let run: ((name: string, input: unknown) => Promise<unknown>) | null = null;
    let exportNow: (() => AdminPages) | null = null;
    function Runner() {
      const host = useVexaHost();
      const admin = useVexaAdmin();
      run = (name, input) => host.runTool(name, input);
      exportNow = admin.exportPages;
      return null;
    }
    const container = await mount(
      <VexaProvider admin={{ pages: SEED, passive: false, discover: "off" }}>
        <AdminProbe />
        <Runner />
      </VexaProvider>,
    );
    expect(container.querySelector('[data-testid="admin"]')?.textContent).toBe("true|/products,/orders|/products,/orders,/products/new|idle");
    let observed: unknown = null;
    await act(async () => {
      observed = await run?.("admin_observe", { path: "/products" });
    });
    expect(observed).toMatchObject({ ok: true, data: { path: "/products", cached: true } });
    expect(typeof (observed as { data: { observedAt: unknown } }).data.observedAt).toBe("string");
    const exported: AdminPages | undefined = (exportNow as (() => AdminPages) | null)?.();
    expect(exported?.pages.map((page) => page.path)).toEqual(["/orders", "/products"]);
  });

  test("an invalid seed is ignored with a warning", async () => {
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (message: string) => warnings.push(message);
    try {
      const container = await mount(
        <VexaProvider admin={{ pages: { version: 3 } as unknown as AdminPages, passive: false, discover: "off" }}>
          <AdminProbe />
        </VexaProvider>,
      );
      expect(container.querySelector('[data-testid="admin"]')?.textContent).toBe("true|||idle");
      expect(warnings[0]).toContain("admin.pages ignored");
    } finally {
      console.warn = original;
    }
  });
});

describe("VexaProvider admin", () => {
  test("inline admin callbacks do not loop the schema effect", async () => {
    const container = await mount(<RerenderingHost renders={5} />);
    expect(container.querySelector('[data-testid="renders"]')?.textContent).toBe("5");
    expect(schemaNames(container)).toBe("echo,admin_observe,admin_run");
  });

  test("rejects host tools with the admin_ prefix", async () => {
    const original = console.error;
    console.error = () => undefined;
    try {
      await expect(
        mount(
          <VexaProvider tools={{ admin_x: echo }}>
            <SchemaProbe />
          </VexaProvider>,
        ),
      ).rejects.toThrow(/reserved admin_ prefix/);
    } finally {
      console.error = original;
    }
  });

  test("adds admin_observe, admin_run and admin_discover next to the host tools", async () => {
    const container = await mount(
      <VexaProvider tools={HOST_TOOLS} admin={{ discover: "model" }}>
        <SchemaProbe />
      </VexaProvider>,
    );
    expect(schemaNames(container)).toBe("echo,admin_observe,admin_run,admin_discover");
    expect(document.querySelector("iframe")).toBeNull();
  });

  test("without admin nothing changes", async () => {
    const container = await mount(
      <VexaProvider tools={HOST_TOOLS}>
        <SchemaProbe />
      </VexaProvider>,
    );
    expect(schemaNames(container)).toBe("echo");
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  test("admin options pass through", async () => {
    const container = await mount(
      <VexaProvider admin={{ confirm: "none", discover: "model" }}>
        <SchemaProbe />
      </VexaProvider>,
    );
    expect(schemaNames(container)).toBe("admin_observe,admin_run,admin_discover");
  });

  test("with discovery off the model has no admin_discover and no frame is created", async () => {
    const container = await mount(
      <VexaProvider admin={ADMIN_NO_DISCOVERY}>
        <SchemaProbe />
      </VexaProvider>,
    );
    expect(schemaNames(container)).toBe("admin_observe,admin_run");
    expect(document.querySelector("iframe")).toBeNull();
  });

  test("inside the discovery frame the provider registers nothing", async () => {
    window.name = "vexa-discover";
    try {
      const container = await mount(
        <VexaProvider tools={HOST_TOOLS} admin>
          <SchemaProbe />
          <AdminProbe />
        </VexaProvider>,
      );
      expect(schemaNames(container)).toBe("echo");
      expect(container.querySelector('[data-testid="admin"]')?.textContent).toBe("false|||idle");
    } finally {
      window.name = "";
    }
  });

  test("pages stored for this origin and user are restored at startup", async () => {
    sessionStorage.setItem(
      "vexa-pages:http://localhost:3001",
      JSON.stringify({ storedAt: Date.now(), file: { version: 1, pages: [{ path: "/orders", title: "Orders", elements: [], unnamed: 0 }], links: [] } }),
    );
    try {
      const container = await mount(
        <VexaProvider admin={{ discover: { mode: "model" } }}>
          <AdminProbe />
        </VexaProvider>,
      );
      expect(container.querySelector('[data-testid="admin"]')?.textContent).toContain("/orders");
    } finally {
      sessionStorage.clear();
    }
  });
});

type FetchCall = { method: string; body: unknown };

function stubFetch(pagesFileEnabled: boolean): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  const stub = async (_input: string | URL | Request, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ method, body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
    if (method === "GET") return Response.json({ models: [], default: null, ...(pagesFileEnabled ? { pagesFile: { enabled: true } } : {}) });
    return Response.json({ written: true, path: "vexa-pages.json", pages: 1 });
  };
  globalThis.fetch = stub as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

function SaveProbe() {
  const { canSave } = useVexaAdmin();
  return <output data-testid="save">{String(canSave)}</output>;
}

async function settle(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

const SYNC_WAIT_MS = 1200;

describe("VexaProvider pages file sync", () => {
  test("auto sync PUTs the pages file once after a capture and not again when nothing changed", async () => {
    const fetching = stubFetch(true);
    try {
      let run: ((name: string, input: unknown) => Promise<unknown>) | null = null;
      function Runner() {
        run = useVexaHost().runTool;
        return null;
      }
      const container = await mount(
        <VexaProvider admin={{ passive: false, discover: "off" }}>
          <SaveProbe />
          <Runner />
        </VexaProvider>,
      );
      await settle(10);
      expect(container.querySelector('[data-testid="save"]')?.textContent).toBe("true");
      await act(async () => {
        await run?.("admin_observe", {});
      });
      await settle(SYNC_WAIT_MS);
      const puts = fetching.calls.filter((call) => call.method === "PUT");
      expect(puts).toHaveLength(1);
      expect(puts[0].body).toMatchObject({ kind: "pages", file: { version: 1 } });
      await act(async () => {
        await run?.("admin_observe", {});
      });
      await settle(SYNC_WAIT_MS);
      expect(fetching.calls.filter((call) => call.method === "PUT")).toHaveLength(1);
    } finally {
      fetching.restore();
    }
  });

  test("sync off never PUTs and canSave stays false", async () => {
    const fetching = stubFetch(true);
    try {
      let run: ((name: string, input: unknown) => Promise<unknown>) | null = null;
      function Runner() {
        run = useVexaHost().runTool;
        return null;
      }
      const container = await mount(
        <VexaProvider admin={{ passive: false, sync: "off", discover: "off" }}>
          <SaveProbe />
          <Runner />
        </VexaProvider>,
      );
      await act(async () => {
        await run?.("admin_observe", {});
      });
      await settle(SYNC_WAIT_MS);
      expect(container.querySelector('[data-testid="save"]')?.textContent).toBe("false");
      expect(fetching.calls.filter((call) => call.method === "PUT")).toHaveLength(0);
    } finally {
      fetching.restore();
    }
  });

  test("canSave is false when the endpoint has no pages file", async () => {
    const fetching = stubFetch(false);
    try {
      const container = await mount(
        <VexaProvider admin={{ passive: false, discover: "off" }}>
          <SaveProbe />
        </VexaProvider>,
      );
      await settle(10);
      expect(container.querySelector('[data-testid="save"]')?.textContent).toBe("false");
      expect(fetching.calls.filter((call) => call.method === "GET")).toHaveLength(1);
    } finally {
      fetching.restore();
    }
  });
});
