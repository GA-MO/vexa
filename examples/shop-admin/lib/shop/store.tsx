"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  findOrder,
  ORDERS,
  type Currency,
  type Locale,
  type Order,
  type ShopFilters,
  type Status,
  type StepsMode,
  type Theme,
} from "./data";

export { CURRENCIES, LOCALES, STEPS_MODES, THEMES, filterOrders } from "./data";
export type { Currency, Locale, ShopFilters, StatusFilter, StepsMode, Theme } from "./data";

export type ShopState = {
  orders: Order[];
  filters: ShopFilters;
  selectedOrderId: string | null;
  theme: Theme;
  locale: Locale;
  currency: Currency;
  steps: StepsMode;
};

export type ShopActions = {
  setFilter: (patch: Partial<ShopFilters>) => ShopFilters;
  selectOrder: (id: string | null) => Order | null;
  updateStatus: (id: string, status: Status) => Order | null;
  refund: (id: string) => Order | null;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale, currency: Currency) => void;
  setSteps: (steps: StepsMode) => void;
};

type ShopStore = {
  getState: () => ShopState;
  subscribe: (listener: () => void) => () => void;
  actions: ShopActions;
};

const INITIAL_STATE: ShopState = {
  orders: ORDERS,
  filters: { status: "all", search: "" },
  selectedOrderId: null,
  theme: "light",
  locale: "en-US",
  currency: "USD",
  steps: "collapsible",
};

const STATUS_EVENT_TITLES: Record<Status, string> = {
  pending: "Marked pending",
  paid: "Payment received",
  shipped: "Shipped",
  delivered: "Delivered",
  refunded: "Refunded",
};

function withEvent(order: Order, status: Status, detail: string): Order {
  return {
    ...order,
    status,
    timeline: [...order.timeline, { title: STATUS_EVENT_TITLES[status], detail, at: new Date().toISOString() }],
  };
}

function createShopStore(): ShopStore {
  let state = INITIAL_STATE;
  const listeners = new Set<() => void>();

  const setState = (patch: Partial<ShopState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const replaceOrder = (id: string, update: (order: Order) => Order): Order | null => {
    const current = findOrder(state.orders, id);
    if (!current) return null;
    const next = update(current);
    setState({ orders: state.orders.map((order) => (order.id === current.id ? next : order)) });
    return next;
  };

  const actions: ShopActions = {
    setFilter: (patch) => {
      const filters = { ...state.filters, ...patch };
      setState({ filters });
      return filters;
    },
    selectOrder: (id) => {
      const order = id ? findOrder(state.orders, id) ?? null : null;
      setState({ selectedOrderId: order?.id ?? null });
      return order;
    },
    updateStatus: (id, status) => replaceOrder(id, (order) => withEvent(order, status, "Updated from the admin")),
    refund: (id) => replaceOrder(id, (order) => withEvent(order, "refunded", "Refund issued from the admin")),
    setTheme: (theme) => setState({ theme }),
    setLocale: (locale, currency) => setState({ locale, currency }),
    setSteps: (steps) => setState({ steps }),
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions,
  };
}

const ShopContext = createContext<ShopStore | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createShopStore);
  return <ShopContext.Provider value={store}>{children}</ShopContext.Provider>;
}

function useShopStore(): ShopStore {
  const store = useContext(ShopContext);
  if (!store) throw new Error("useShop must be used inside ShopProvider");
  return store;
}

export function useShop(): ShopState {
  const store = useShopStore();
  return useSyncExternalStore(store.subscribe, store.getState, () => INITIAL_STATE);
}

export function useShopActions(): ShopActions {
  return useShopStore().actions;
}

export function useShopSnapshot(): () => ShopState {
  return useShopStore().getState;
}
