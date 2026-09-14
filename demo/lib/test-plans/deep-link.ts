import type { Spec } from "vexa/protocol";
import type { HostToolDescriptor } from "vexa/react";
import { ORDERS, findOrder, totals } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const ORDER_SECTIONS = ["items", "timeline"] as const;

const openOrderTool: HostToolDescriptor = {
  name: "open_order",
  description: "Open the detail page of one order by id and optionally scroll to its items or timeline section.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 },
      section: { type: "string", enum: ORDER_SECTIONS },
    },
    required: ["id"],
    additionalProperties: false,
  },
};

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
  title: "Model deep-links into an order section",
  controlPath: "user prompt → open_order host tool (id, section) → router.push + scrollIntoView",
  page: "/orders",
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
  hostTools: [openOrderTool],
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
  bestPractice:
    "Give the deep-linking tool both an id and an optional section param in one call (open_order({ id, section })) instead of two tools, so the model cannot open the page and forget to scroll, or scroll before the page exists.",
};
