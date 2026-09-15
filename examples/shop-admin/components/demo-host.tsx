"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";
import { VexaChatOverlay } from "vexa/chat";
import { defineTool, useVexaHost, VexaProvider, type HostTool, type HostToolResult } from "vexa/react";
import { MOCK_MODEL_ID } from "@/lib/mock-model-id";
import type { ScenarioSetup } from "@/lib/scenarios/types";
import { LOCALES, THEMES, filterOrders, findOrder, totals, type Order } from "@/lib/shop/data";
import { HOST_TOOL_DEFINITIONS } from "@/lib/shop/host-tools";
import { ShopProvider, useShop, useShopActions, useShopSnapshot, type ShopActions, type ShopState } from "@/lib/shop/store";

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

const GUIDES_PREFIX = "/guides";

/** A guide's "Try it": put the page in the state the scenario assumes, go to its page, open the chat, send the prompt. */
export type GuidePromptRequest = { prompt: string; page: string; setup: ScenarioSetup | null };

type ChatControls = { openChat: () => void; tryPrompt: (request: GuidePromptRequest) => void };

const ChatControlsContext = createContext<ChatControls>({ openChat: () => {}, tryPrompt: () => {} });

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
      ...HOST_TOOL_DEFINITIONS.navigate,
      run: ({ to }) => {
        router.push(to);
        return { ok: true, summary: `Opened ${to}`, data: { path: to } };
      },
    }),
    set_filter: defineTool({
      ...HOST_TOOL_DEFINITIONS.set_filter,
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
      ...HOST_TOOL_DEFINITIONS.select_order,
      run: ({ id }) => {
        const order = actions.selectOrder(id);
        if (!order) return unknownOrder(id);
        return { ok: true, summary: `Selected ${order.id}`, data: orderSummary(order) };
      },
    }),
    open_order: defineTool({
      ...HOST_TOOL_DEFINITIONS.open_order,
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
      ...HOST_TOOL_DEFINITIONS.update_status,
      confirm: true,
      run: ({ id, status }) => {
        const order = actions.updateStatus(id, status);
        if (!order) return unknownOrder(id);
        return { ok: true, summary: `${order.id} is now ${status}`, data: orderSummary(order) };
      },
    }),
    set_theme: defineTool({
      ...HOST_TOOL_DEFINITIONS.set_theme,
      confirm: true,
      run: ({ theme }) => {
        actions.setTheme(theme);
        return { ok: true, summary: `Theme set to ${theme}`, data: { theme } };
      },
    }),
    set_locale: defineTool({
      ...HOST_TOOL_DEFINITIONS.set_locale,
      run: ({ locale, currency }) => {
        actions.setLocale(locale, currency);
        return { ok: true, summary: `Locale ${locale}, currency ${currency}`, data: { locale, currency } };
      },
    }),
  };
}

function isGuidePage(pathname: string) {
  return pathname.startsWith(GUIDES_PREFIX);
}

function applySetup(setup: ScenarioSetup | null, actions: ShopActions) {
  if (!setup) return;
  if (setup.selectedOrderId !== undefined) actions.selectOrder(setup.selectedOrderId);
  if (setup.filters) actions.setFilter(setup.filters);
}

/** Sends the pending guide prompt once the router has landed on the page it targets, so the request carries that page's context. */
function GuidePromptSender({ pending, onSent }: { pending: GuidePromptRequest | null; onSent: () => void }) {
  const pathname = usePathname();
  const { sendToChat } = useVexaHost();
  useEffect(() => {
    if (!pending) return;
    const targetIsGuide = isGuidePage(pending.page);
    if (!targetIsGuide && pathname !== pending.page) return;
    if (sendToChat(pending.prompt)) onSent();
  }, [pending, pathname, sendToChat, onSent]);
  return null;
}

function ShopHost({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, locale, currency, steps } = useShop();
  const snapshot = useShopSnapshot();
  const actions = useShopActions();
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<GuidePromptRequest | null>(null);
  const [preferMock, setPreferMock] = useState(false);
  useEffect(() => {
    if (isGuidePage(pathname)) setPreferMock(true);
  }, [pathname]);

  const tools = useMemo(() => createShopTools(router, snapshot, actions), [router, snapshot, actions]);
  const format = useMemo(() => ({ locale, currency }), [locale, currency]);
  const themeConfig = useMemo(() => ({ mode: theme }), [theme]);
  const defaultModel = preferMock ? MOCK_MODEL_ID : undefined;
  const chat = useMemo(
    () => ({
      title: "Vexa Shop assistant",
      subtitle: "Controls this admin · renders UI",
      launcherLabel: "Ask the shop assistant",
      steps,
      suggestions: SUGGESTIONS,
      defaultModel,
      backdrop: false,
    }),
    [steps, defaultModel],
  );
  const controls = useMemo<ChatControls>(
    () => ({
      openChat: () => setChatOpen(true),
      tryPrompt: (request) => {
        applySetup(request.setup, actions);
        if (!isGuidePage(request.page) && window.location.pathname !== request.page) router.push(request.page);
        setChatOpen(true);
        setPendingPrompt(request);
      },
    }),
    [actions, router],
  );
  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

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
        <GuidePromptSender pending={pendingPrompt} onSent={clearPendingPrompt} />
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
