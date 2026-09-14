import type { Spec } from "vexa/protocol";
import type { HostToolDescriptor } from "vexa/react";
import { ORDERS, STATUSES, totals } from "@/lib/shop/data";
import { filterOrders, type ShopFilters } from "@/lib/shop/store";
import type { Scenario } from "@/lib/scenarios/types";

const setFilterTool: HostToolDescriptor = {
  name: "set_filter",
  description:
    "Filter the orders table by status and/or a search text matched against order id, customer name and city; opens /orders and returns the matching rows.",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: [...STATUSES, "all"], description: "Order status, or all" },
      search: { type: "string", maxLength: 80, description: "Free text matched against id, customer and city, for example Bangkok" },
    },
    additionalProperties: false,
  },
};

function orderRow(order: (typeof ORDERS)[number]) {
  const sums = totals(order);
  return { id: order.id, customer: order.customer, city: order.city, status: order.status, total: sums.total };
}

const context: { path: string; filters: ShopFilters; selectedOrderId: string | null } = {
  path: "/orders",
  filters: { status: "all", search: "" },
  selectedOrderId: null,
};

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "set_filter", description: "A page-state tool: it filters the table immediately and its effect is visible in context on the next turn." },
      children: ["result"],
    },
    result: {
      type: "KeyValue",
      props: { pairs: { $state: "/display/pairs" }, size: "sm" },
    },
  },
};

export const scenario: Scenario = {
  id: "page-state",
  title: "Model filters the orders table",
  controlPath: "user prompt → set_filter host tool → table filters → context.filters on the next turn",
  page: "/orders",
  fixture: {
    spec,
    state: {
      display: {
        pairs: [
          { label: "tool", value: "set_filter" },
          { label: "status", value: "pending" },
          { label: "search", value: "Bangkok" },
        ],
      },
    },
  },
  context,
  hostTools: [setFilterTool],
  tools: {
    set_filter: (input) => {
      const patch: Partial<ShopFilters> = {};
      if (typeof input.status === "string") patch.status = input.status as ShopFilters["status"];
      if (typeof input.search === "string") patch.search = input.search;
      context.filters = { ...context.filters, ...patch };
      const matches = filterOrders(ORDERS, context.filters);
      return {
        ok: true,
        summary: `${matches.length} order${matches.length === 1 ? "" : "s"} match status=${context.filters.status}${context.filters.search ? ` search="${context.filters.search}"` : ""}`,
        data: { filters: context.filters, count: matches.length, orders: matches.slice(0, 10).map(orderRow) },
      };
    },
  },
  script: [
    { user: "Show pending orders in Bangkok", expectTools: ["set_filter"], expectText: /./ },
    { user: "What filter is currently applied to the orders table?", expectNoTools: true, expectText: /Bangkok/i },
  ],
  bestPractice:
    "A tool that changes on-screen state (not the route) should return the new filter and the matching rows in one result, and the persona should list that state (context.filters) as authoritative so a follow-up question about \"what's applied now\" is answered from context instead of calling the tool again.",
};
