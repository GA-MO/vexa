import type { Spec } from "vexa/protocol";
import type { HostToolDescriptor } from "vexa/react";
import { findOrder, ORDERS, STATUSES } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const ORDER_ID = "C-1042";

const updateStatusDescriptor: HostToolDescriptor = {
  name: "update_status",
  description:
    "Change an order's status (pending, paid, shipped, delivered, refunded) and add a timeline event; asks the user to confirm first. Call it directly with the id and status from the request — it looks the order up itself, so there is no need to read the order before calling it.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 },
      status: { type: "string", enum: [...STATUSES] },
    },
    required: ["id", "status"],
  },
};

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Card", props: { title: "Confirm change", description: `update_status will set ${ORDER_ID} to shipped` }, children: ["actions"] },
    actions: { type: "Stack", props: { direction: "horizontal", gap: "sm" }, children: ["approve", "reject"] },
    approve: { type: "Button", props: { label: "Approve", variant: "primary" } },
    reject: { type: "Button", props: { label: "Reject", variant: "secondary" } },
  },
};

export const scenario: Scenario = {
  id: "approval",
  title: "Confirm before a host tool changes something",
  controlPath: "user asks → model calls update_status (confirm: true) → approval card → Reject → ok:false, no retry",
  page: `/orders/${ORDER_ID}`,
  fixture: { spec },
  context: { path: `/orders/${ORDER_ID}`, selectedOrderId: ORDER_ID },
  hostTools: [updateStatusDescriptor],
  tools: {
    update_status: {
      confirm: true,
      run: (input) => {
        const id = String(input.id ?? "");
        const status = String(input.status ?? "");
        const order = findOrder(ORDERS, id);
        if (!order) return { ok: false, error: `No order with id "${id}"` };
        return { ok: true, summary: `${order.id} is now ${status}`, data: { id: order.id, status } };
      },
    },
  },
  script: [
    { user: `Mark order ${ORDER_ID} as shipped`, expectTools: ["update_status"] },
    { reject: "update_status", expectNoTools: true, expectText: /not|nothing|didn't|cancel/i },
  ],
  bestPractice:
    "A host tool marked confirm: true must pause exactly where the real ConfirmationTray would, before run() ever executes, so a rejection always yields the library's own \"The user declined to run this tool\" error and never a partially applied change.",
};
