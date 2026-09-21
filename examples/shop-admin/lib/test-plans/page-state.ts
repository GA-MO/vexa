import type { Spec } from "vexa/protocol";
import { hostToolDescriptor } from "@/lib/shop/host-tools";
import { ORDERS, filterOrders, totals, type ShopFilters } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";
import { toolDataNumber } from "@/lib/scenarios/mock-output";

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
  measures: "steering",
  title: "Model filters the orders table",
  controlPath: "user prompt → set_filter host tool → table filters → context.filters on the next turn",
  page: "/orders",
  docs: "host/host-tools",
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
  hostTools: [hostToolDescriptor("set_filter")],
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
  mock: [
    {
      match: /pending orders in Bangkok/i,
      steps: [
        { reasoning: "Showing orders means filtering the table, so set_filter with status pending and Bangkok as the search text." },
        {
          tool: "set_filter",
          input: { status: "pending", search: "Bangkok" },
          then: (output) => [{ text: `The table now shows ${toolDataNumber(output, "count")} pending orders in Bangkok.` }],
        },
      ],
    },
    {
      match: /what filter is currently applied/i,
      steps: [
        { reasoning: "context.filters already holds the applied filter, so this needs no tool call." },
        { text: "The orders table is filtered to status pending with the search text Bangkok." },
      ],
    },
  ],
  bestPractice:
    "A tool that changes on-screen state (not the route) should return the new filter and the matching rows in one result, and the persona should list that state (context.filters) as authoritative so a follow-up question about \"what's applied now\" is answered from context instead of calling the tool again.",
};
