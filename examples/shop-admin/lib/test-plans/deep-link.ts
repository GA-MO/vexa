import type { Spec } from "vexa/protocol";
import { hostToolDescriptor } from "@/lib/shop/host-tools";
import { ORDERS, findOrder, totals } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const order = findOrder(ORDERS, "C-1042")!;

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "open_order", description: "One tool call both opens the order and scrolls to a section — there is no separate open_section tool." },
      children: ["result"],
    },
    result: {
      type: "KeyValue",
      props: { pairs: { $state: "/display/pairs" }, size: "sm" },
    },
  },
};

export const scenario: Scenario = {
  id: "deep-link",
  measures: "steering",
  title: "Model deep-links into an order section",
  controlPath: "user prompt → open_order host tool (id, section) → router.push + scrollIntoView",
  page: "/orders",
  docs: "host/host-tools",
  fixture: {
    spec,
    state: {
      display: {
        pairs: [
          { label: "tool", value: "open_order" },
          { label: "id", value: order.id },
          { label: "section", value: "timeline" },
          { label: "route", value: `/orders/${order.id}#timeline` },
        ],
      },
    },
  },
  context: { path: "/orders" },
  hostTools: [hostToolDescriptor("open_order")],
  tools: {
    open_order: (input) => {
      const id = typeof input.id === "string" ? input.id : "";
      const found = findOrder(ORDERS, id);
      if (!found) return { ok: false, error: `No order with id "${id}"` };
      const section = typeof input.section === "string" ? input.section : undefined;
      return {
        ok: true,
        summary: `Opened ${found.id}${section ? ` at ${section}` : ""}`,
        data: {
          id: found.id,
          customer: found.customer,
          city: found.city,
          status: found.status,
          total: totals(found).total,
          itemCount: totals(found).itemCount,
          createdAt: found.createdAt,
          items: found.items,
          timeline: found.timeline,
        },
      };
    },
  },
  script: [
    {
      user: `Open order ${order.id} and jump straight to its timeline`,
      expectTools: ["open_order"],
      expectToolsInOrder: true,
      expectText: new RegExp(order.id),
    },
  ],
  mock: [
    {
      match: new RegExp(`open order ${order.id} .* timeline`, "i"),
      steps: [
        { reasoning: "open_order takes both the id and the section, so one call opens the page and scrolls to the timeline." },
        { tool: "open_order", input: { id: order.id, section: "timeline" }, then: [{ text: `Opened ${order.id} at its timeline.` }] },
      ],
    },
  ],
  bestPractice:
    "Give the deep-linking tool both an id and an optional section param in one call (open_order({ id, section })) instead of two tools, so the model cannot open the page and forget to scroll, or scroll before the page exists.",
};
