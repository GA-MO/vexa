import type { Spec } from "vexa/protocol";
import { ORDERS, findOrder, totals, type Order } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

function orderSummary(order: Order) {
  const sums = totals(order);
  return { id: order.id, customer: order.customer, city: order.city, status: order.status, total: sums.total, itemCount: sums.itemCount, createdAt: order.createdAt };
}

const order = findOrder(ORDERS, "C-1041")!;
const expectedResult = orderSummary(order);

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "Row actions", description: "This button calls a host tool through runTool directly, with no model round trip." },
      children: ["kv", "select-btn"],
    },
    kv: {
      type: "KeyValue",
      props: {
        pairs: [
          { label: "Order", value: order.id },
          { label: "Customer", value: order.customer },
          { label: "City", value: order.city },
        ],
        size: "sm",
      },
    },
    "select-btn": {
      type: "Button",
      props: { label: `Select ${order.id}`, variant: "primary" },
      on: { press: [{ action: "runTool", params: { name: "select_order", input: { id: order.id } } }] },
    },
  },
};

export const scenario: Scenario = {
  id: "button-runtool",
  measures: "runtime",
  title: "Spec button runs a host tool",
  controlPath: "Button.on.press → runTool select_order → host tool → /tools/select_order + /toast",
  page: "/orders",
  docs: "host/runtool",
  opener: "Show row actions for order C-1041",
  fixture: { spec },
  tools: {
    select_order: (input) => {
      const id = typeof input.id === "string" ? input.id : "";
      const found = findOrder(ORDERS, id);
      if (!found) return { ok: false, error: `No order with id "${id}"` };
      return { ok: true, summary: `Selected ${found.id}`, data: orderSummary(found) };
    },
  },
  script: [
    {
      press: "select-btn",
      expectState: { "/tools/select_order": expectedResult },
      expectToast: `Selected ${order.id}`,
      expectNoModelTurn: true,
    },
  ],
  bestPractice:
    "A button that only needs host data should call the host tool directly through runTool; the model is never involved, so the same headless handlers that drive the real UI (createVexaHandlers + createGuardedStore) can assert the result under /tools/<name> and the /toast summary with no server running.",
};
