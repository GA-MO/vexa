import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import {
  createAdminTools,
  createObservationCache,
  createResolver,
  discoverPages,
  exportPages,
  importPages,
  watchPages,
  type AdminConfirmPolicy,
  type AdminPages,
  type DiscoverOptions,
  type DiscoverOutcome,
  type DiscoveryProgress,
  type PageInfo,
  type Step,
} from "vexa/admin";
import OverviewPage from "@/app/page";
import OrdersPage from "@/app/orders/page";
import NewProductPage from "@/app/products/new/page";
import ProductsPage from "@/app/products/page";
import SettingsPage from "@/app/settings/page";
import { OrderDetailPage } from "@/components/shop/order-detail-page";
import { ProductDetailPage } from "@/components/shop/product-detail-page";
import { TopNav } from "@/components/top-nav";
import { ShopProvider, useShopActions, useShopSnapshot, type ShopState } from "@/lib/shop/store";
import type { HeadlessTool, ScenarioSetup } from "./types";

const ORDER_DETAIL = /^\/orders\/([^/]+)$/;
const PRODUCT_DETAIL = /^\/products\/(?!new$)([^/]+)$/;
const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/orders": "Orders",
  "/products": "Products",
  "/products/new": "New product",
  "/settings": "Settings",
};

type PathStore = { current: string; listeners: Set<() => void> };

function withParams(id: string, page: ReactNode): ReactNode {
  return <PathParamsContext.Provider value={{ id }}>{page}</PathParamsContext.Provider>;
}

function pageFor(path: string): ReactNode {
  if (path === "/") return <OverviewPage />;
  if (path === "/orders") return <OrdersPage />;
  if (path === "/products") return <ProductsPage />;
  if (path === "/products/new") return <NewProductPage />;
  if (path === "/settings") return <SettingsPage />;
  const order = ORDER_DETAIL.exec(path);
  if (order) return withParams(order[1], <OrderDetailPage />);
  const product = PRODUCT_DETAIL.exec(path);
  if (product) return withParams(product[1], <ProductDetailPage />);
  return (
    <main>
      <h1>Not found</h1>
    </main>
  );
}

function titleFor(path: string) {
  const detail = ORDER_DETAIL.exec(path) ?? PRODUCT_DETAIL.exec(path);
  return detail ? detail[1] : (PAGE_TITLES[path] ?? "Not found");
}

function ApplySetup({ setup }: { setup: ScenarioSetup }) {
  const { selectOrder, setFilter } = useShopActions();
  useEffect(() => {
    if (setup.filters) setFilter(setup.filters);
    if (setup.selectedOrderId !== undefined) selectOrder(setup.selectedOrderId);
  }, [setup, selectOrder, setFilter]);
  return null;
}

type StateProbe = { read: (() => ShopState) | null };

function ProbeStore({ probe }: { probe: StateProbe }) {
  probe.read = useShopSnapshot();
  return null;
}

function routerFor(navigate: (path: string) => void): AppRouterInstance {
  const noop = () => undefined;
  return { push: navigate, replace: navigate, back: noop, forward: noop, refresh: noop, prefetch: noop };
}

function CurrentPage({ store }: { store: PathStore }) {
  const path = useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => store.current,
  );
  return (
    <PathnameContext.Provider value={path}>
      <TopNav />
      {pageFor(path)}
    </PathnameContext.Provider>
  );
}

function interceptLinks(container: HTMLElement, navigate: (path: string) => void) {
  container.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    const href = link?.getAttribute("href");
    if (!href?.startsWith("/")) return;
    event.preventDefault();
    navigate(href);
  });
}

export type DomPageHostOptions = {
  setup?: ScenarioSetup;
  confirm?: (steps: Step[]) => Promise<boolean>;
  confirmPolicy?: AdminConfirmPolicy;
  pages?: AdminPages;
  passive?: boolean;
  frame?: boolean;
};

export type DomPageHost = {
  container: HTMLElement;
  page: () => PageInfo;
  state: () => ShopState;
  navigate: (path: string) => Promise<void>;
  tools: Record<string, HeadlessTool>;
  discover: (options?: DiscoverOptions) => Promise<DiscoveryProgress>;
  discoverInto: (cache: ReturnType<typeof createObservationCache>, options?: DiscoverOptions) => Promise<DiscoveryProgress>;
  exportPages: () => AdminPages;
  pressButton: (name: string) => Promise<boolean>;
  settle: () => Promise<void>;
  dispose: () => Promise<void>;
};

const PASSIVE_QUIET_MS = 30;
const PASSIVE_SETTLE_MS = PASSIVE_QUIET_MS * 3;

const SETTLE_ROUNDS = 3;

async function settle() {
  for (let round = 0; round < SETTLE_ROUNDS; round += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mountApp(container: HTMLElement, store: PathStore, setup: ScenarioSetup | undefined, navigate: (path: string) => void, probe: StateProbe): Promise<Root> {
  const root = createRoot(container);
  root.render(
    <AppRouterContext.Provider value={routerFor(navigate)}>
      <ShopProvider>
        <ProbeStore probe={probe} />
        {setup ? <ApplySetup setup={setup} /> : null}
        <CurrentPage store={store} />
      </ShopProvider>
    </AppRouterContext.Provider>,
  );
  await settle();
  return root;
}

function buttonNamed(root: ParentNode, name: string): HTMLElement | null {
  const wanted = name.trim().toLowerCase();
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('button, [role="button"]'));
  return buttons.find((button) => (button.textContent ?? "").trim().toLowerCase() === wanted) ?? null;
}

function toHeadlessTools(tools: ReturnType<typeof createAdminTools>): Record<string, HeadlessTool> {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [
      name,
      (input: Record<string, unknown>) => tool.run(input, { toolCallId: null, source: "model" }),
    ]),
  );
}

const DEV_ONLY_PAGES = /^\/guides(\/|$)/;

function discoverElsewhere(startPath: () => string, cache: ReturnType<typeof createObservationCache>, restored: boolean): (request: { limit?: number }) => Promise<DiscoverOutcome> {
  return async (request) => {
    if (restored) return { ok: true, cached: true, progress: { status: "done", visited: cache.observed(), pending: 0, errors: [] } };
    const frame = await createDomPageHost(startPath(), { passive: false, frame: false });
    try {
      const progress = await frame.discoverInto(cache, { limit: request.limit, skip: (path) => DEV_ONLY_PAGES.test(path) });
      return { ok: true, progress };
    } finally {
      await frame.dispose();
    }
  };
}

/** Mounts the real shop-admin page for a path in happy-dom so the scenario runner can execute admin_observe / admin_run against it without a browser; `admin_discover` walks a second mounted copy the way the browser walks a hidden frame. */
export async function createDomPageHost(initialPath: string, options: DomPageHostOptions = {}): Promise<DomPageHost> {
  const store: PathStore = { current: initialPath, listeners: new Set() };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const setPath = (path: string) => {
    store.current = path;
    for (const listener of store.listeners) listener();
  };
  const navigate = async (path: string) => {
    flushSync(() => setPath(path));
    await settle();
  };
  interceptLinks(container, (path) => void navigate(path));
  const probe: StateProbe = { read: null };
  const reactRoot = await mountApp(container, store, options.setup, (path) => void navigate(path), probe);
  const state = (): ShopState => {
    if (!probe.read) throw new Error("The shop store is not mounted");
    return probe.read();
  };
  const page = (): PageInfo => ({ path: store.current, title: titleFor(store.current) });
  const resolver = createResolver();
  const cache = createObservationCache();
  if (options.pages) importPages(cache, options.pages);
  const root = () => container.ownerDocument.body;
  const stopWatching = options.passive === false ? () => undefined : watchPages({ root, page, cache, wait: { quietMs: PASSIVE_QUIET_MS } });
  const tools = createAdminTools({
    root,
    page,
    resolver,
    cache,
    confirm: options.confirm ?? (async () => true),
    options: () => ({ navigate, confirm: options.confirmPolicy }),
    discover: options.frame === false ? undefined : discoverElsewhere(() => store.current, cache, options.pages !== undefined),
  });
  const pressButton = async (name: string) => {
    const button = buttonNamed(root(), name);
    if (!button) return false;
    button.click();
    await settle();
    return true;
  };
  const discoverInto = (target: ReturnType<typeof createObservationCache>, discoverOptions?: DiscoverOptions) =>
    discoverPages(
      {
        root,
        page,
        resolver: createResolver(),
        cache: target,
        navigate: async (path) => {
          await navigate(path);
          return { ok: true, mode: "router" };
        },
      },
      discoverOptions,
    );
  const discover = (discoverOptions?: DiscoverOptions) => discoverInto(cache, discoverOptions);
  return {
    container,
    page,
    state,
    navigate,
    tools: toHeadlessTools(tools),
    discover,
    discoverInto,
    exportPages: () => exportPages(cache),
    pressButton,
    settle: () => new Promise((resolve) => setTimeout(resolve, PASSIVE_SETTLE_MS)),
    dispose: async () => {
      stopWatching();
      reactRoot.unmount();
      container.remove();
    },
  };
}
