"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";
import { VexaChatOverlay } from "vexa/chat";
import { defineTool, VexaProvider, type HostTool, type HostToolResult } from "vexa/react";
import { STATUSES, findOrder, totals, type Order } from "@/lib/shop/data";
import {
  CURRENCIES,
  LOCALES,
  ShopProvider,
  THEMES,
  filterOrders,
  useShop,
  useShopActions,
  useShopSnapshot,
  type ShopActions,
  type ShopState,
} from "@/lib/shop/store";

const ROUTES = ["/", "/orders", "/settings", "/tests"] as const;
const ORDER_SECTIONS = ["items", "timeline"] as const;
const SECTION_POLL_MS = 50;
const SECTION_POLL_LIMIT = 40;

const SUGGESTIONS = [
  "Show pending orders in Bangkok",
  "Open order C-1042",
  "Switch to dark theme",
  "Refund the last delivered order",
].map((prompt) => ({ label: prompt, prompt }));

const contextSchema = z.object({
  path: z.string(),
  filters: z.object({ status: z.string(), search: z.string() }),
  selectedOrderId: z.string().nullable(),
  theme: z.enum(THEMES),
  locale: z.enum(LOCALES),
});

type ChatControls = { openChat: () => void };

const ChatControlsContext = createContext<ChatControls>({ openChat: () => {} });

export function useChatControls(): ChatControls {
  return useContext(ChatControlsContext);
}

function orderSummary(order: Order) {
  const { total, itemCount } = totals(order);
  return { id: order.id, customer: order.customer, city: order.city, status: order.status, total, itemCount, createdAt: order.createdAt };
}

function unknownOrder(id: string): HostToolResult {
  return { ok: false, error: `No order with id "${id}"` };
}

function waitForElement(id: string): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    const poll = () => {
      const element = document.getElementById(id);
      if (element || attempts >= SECTION_POLL_LIMIT) return resolve(element);
      attempts += 1;
      window.setTimeout(poll, SECTION_POLL_MS);
    };
    poll();
  });
}

function createShopTools(
  router: ReturnType<typeof useRouter>,
  snapshot: () => ShopState,
  actions: ShopActions,
): Record<string, HostTool> {
  return {
    navigate: defineTool({
      description: "Open one of the admin pages: / (overview), /orders, /settings, or /tests.",
      input: z.object({ to: z.enum(ROUTES) }),
      run: ({ to }) => {
        router.push(to);
        return { ok: true, summary: `Opened ${to}`, data: { path: to } };
      },
    }),
    set_filter: defineTool({
      description: "Filter the orders table by status and/or a search text matched against order id, customer name and city; opens /orders and returns the matching rows.",
      input: z.object({
        status: z.enum([...STATUSES, "all"]).optional().describe("Order status, or all"),
        search: z.string().max(80).optional().describe("Free text matched against id, customer and city, for example Bangkok"),
      }),
      run: ({ status, search }) => {
        const filters = actions.setFilter({ ...(status ? { status } : {}), ...(search !== undefined ? { search } : {}) });
        if (window.location.pathname !== "/orders") router.push("/orders");
        const matches = filterOrders(snapshot().orders, filters);
        return {
          ok: true,
          summary: `${matches.length} order${matches.length === 1 ? "" : "s"} match status=${filters.status}${filters.search ? ` search="${filters.search}"` : ""}`,
          data: { filters, count: matches.length, orders: matches.slice(0, 10).map(orderSummary) },
        };
      },
    }),
    select_order: defineTool({
      description: "Highlight one row in the orders table by order id without leaving the page.",
      input: z.object({ id: z.string().min(1) }),
      run: ({ id }) => {
        const order = actions.selectOrder(id);
        if (!order) return unknownOrder(id);
        return { ok: true, summary: `Selected ${order.id}`, data: orderSummary(order) };
      },
    }),
    open_order: defineTool({
      description: "Open the detail page of one order by id and optionally scroll to its items or timeline section.",
      input: z.object({ id: z.string().min(1), section: z.enum(ORDER_SECTIONS).optional() }),
      run: async ({ id, section }) => {
        const order = findOrder(snapshot().orders, id);
        if (!order) return unknownOrder(id);
        actions.selectOrder(order.id);
        router.push(`/orders/${order.id}${section ? `#${section}` : ""}`);
        if (section) {
          const element = await waitForElement(section);
          element?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return {
          ok: true,
          summary: `Opened ${order.id}${section ? ` at ${section}` : ""}`,
          data: { ...orderSummary(order), items: order.items, timeline: order.timeline },
        };
      },
    }),
    update_status: defineTool({
      description:
        "Change an order's status (pending, paid, shipped, delivered, refunded) and add a timeline event. Call it directly with the id and status from the request; it looks the order up itself and opens its own confirmation prompt in the app, so do not read the order first and do not ask the user to confirm in chat.",
      input: z.object({ id: z.string().min(1), status: z.enum(STATUSES) }),
      confirm: true,
      run: ({ id, status }) => {
        const order = actions.updateStatus(id, status);
        if (!order) return unknownOrder(id);
        return { ok: true, summary: `${order.id} is now ${status}`, data: orderSummary(order) };
      },
    }),
    set_theme: defineTool({
      description:
        "Switch the admin between the light and dark theme. Call it directly as soon as the user asks; it opens its own confirmation prompt in the app, so do not ask the user to confirm in chat first.",
      input: z.object({ theme: z.enum(THEMES) }),
      confirm: true,
      run: ({ theme }) => {
        actions.setTheme(theme);
        return { ok: true, summary: `Theme set to ${theme}`, data: { theme } };
      },
    }),
    set_locale: defineTool({
      description: "Set the display locale (en-US or th-TH) and currency (USD or THB) used for every number on screen.",
      input: z.object({ locale: z.enum(LOCALES), currency: z.enum(CURRENCIES) }),
      run: ({ locale, currency }) => {
        actions.setLocale(locale, currency);
        return { ok: true, summary: `Locale ${locale}, currency ${currency}`, data: { locale, currency } };
      },
    }),
  };
}

function ShopHost({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, locale, currency, steps } = useShop();
  const snapshot = useShopSnapshot();
  const actions = useShopActions();
  const [chatOpen, setChatOpen] = useState(false);

  const tools = useMemo(() => createShopTools(router, snapshot, actions), [router, snapshot, actions]);
  const format = useMemo(() => ({ locale, currency }), [locale, currency]);
  const themeConfig = useMemo(() => ({ mode: theme }), [theme]);
  const chat = useMemo(
    () => ({
      title: "Vexa Shop assistant",
      subtitle: "Controls this admin · renders UI",
      launcherLabel: "Ask the shop assistant",
      steps,
      suggestions: SUGGESTIONS,
    }),
    [steps],
  );
  const controls = useMemo<ChatControls>(() => ({ openChat: () => setChatOpen(true) }), []);

  const context = useCallback(() => {
    const state = snapshot();
    return {
      path: pathname,
      filters: state.filters,
      selectedOrderId: state.selectedOrderId,
      theme: state.theme,
      locale: state.locale,
    };
  }, [snapshot, pathname]);

  const onToolResult = useCallback((name: string, result: HostToolResult) => {
    console.info("[vexa] tool", name, result);
  }, []);

  return (
    <VexaProvider
      format={format}
      theme={themeConfig}
      chat={chat}
      context={context}
      contextSchema={contextSchema}
      tools={tools}
      onToolResult={onToolResult}
    >
      <ChatControlsContext.Provider value={controls}>
        <div className="min-h-dvh bg-background text-foreground">{children}</div>
        <VexaChatOverlay open={chatOpen} onOpenChange={setChatOpen} />
      </ChatControlsContext.Provider>
    </VexaProvider>
  );
}

export function DemoHost({ children }: { children: ReactNode }) {
  return (
    <ShopProvider>
      <ShopHost>{children}</ShopHost>
    </ShopProvider>
  );
}
