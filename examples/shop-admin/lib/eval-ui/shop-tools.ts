import type { HostToolDescriptor } from "vexa/react";
import type { HeadlessTool } from "@/lib/scenarios/types";
import type { DomPageHost } from "@/lib/scenarios/dom-host";
import { HOST_TOOL_DEFINITIONS, hostToolDescriptor, type HostToolName } from "@/lib/shop/host-tools";
import { ORDERS, filterOrders, findOrder, totals, type Order, type ShopFilters } from "@/lib/shop/data";

const ROW_LIMIT = 10;

function orderRow(order: Order) {
  return { id: order.id, customer: order.customer, city: order.city, status: order.status, total: totals(order).total };
}

export function shopHostToolDescriptors(): HostToolDescriptor[] {
  return (Object.keys(HOST_TOOL_DEFINITIONS) as HostToolName[]).map(hostToolDescriptor);
}

/** The shop's own host tools as a real user's browser would run them: navigation goes through the page host, data comes from the same fixtures the pages render. */
export function evalShopTools(domPage: DomPageHost): Record<string, HeadlessTool> {
  const filters: ShopFilters = { status: "all", search: "" };
  return {
    navigate: async (input) => {
      await domPage.navigate(String(input.to ?? "/"));
      return { ok: true, summary: `Opened ${String(input.to)}` };
    },
    set_filter: async (input) => {
      if (typeof input.status === "string") filters.status = input.status as ShopFilters["status"];
      if (typeof input.search === "string") filters.search = input.search;
      await domPage.navigate("/orders");
      const matches = filterOrders(ORDERS, filters);
      return { ok: true, summary: `${matches.length} orders match`, data: { filters, count: matches.length, orders: matches.slice(0, ROW_LIMIT).map(orderRow) } };
    },
    select_order: (input) => ({ ok: true, summary: `Selected ${String(input.id)}`, data: { id: input.id } }),
    open_order: async (input) => {
      const order = findOrder(ORDERS, String(input.id ?? ""));
      if (!order) return { ok: false, error: `No order with id "${String(input.id)}"` };
      await domPage.navigate(`/orders/${order.id}`);
      return { ok: true, summary: `Opened ${order.id}`, data: { ...orderRow(order), items: order.items, timeline: order.timeline } };
    },
    update_status: (input) => ({ ok: true, summary: `${String(input.id)} is now ${String(input.status)}`, data: input }),
    set_theme: (input) => ({ ok: true, summary: `Theme is ${String(input.theme)}`, data: input }),
    set_locale: (input) => ({ ok: true, summary: `Locale is ${String(input.locale)}`, data: input }),
  };
}
