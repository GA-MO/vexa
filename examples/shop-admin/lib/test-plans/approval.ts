import type { Spec } from "vexa/protocol";
import { hostToolDescriptor } from "@/lib/shop/host-tools";
import { findOrder, ORDERS } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const ORDER_ID = "C-1042";

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
  measures: "steering",
  title: "Confirm before a host tool changes something",
  controlPath: "user asks → model calls update_status (confirm: true) → approval card → Reject → ok:false, no retry",
  page: `/orders/${ORDER_ID}`,
  docs: "host/host-tools",
  fixture: { spec },
  context: { path: `/orders/${ORDER_ID}`, selectedOrderId: ORDER_ID },
  hostTools: [hostToolDescriptor("update_status")],
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
  mock: [
    {
      match: new RegExp(`mark order ${ORDER_ID} as shipped`, "i"),
      steps: [
        { reasoning: "update_status changes data, so the app will ask the user to confirm before it runs; I call it directly with the id and status." },
        {
          tool: "update_status",
          input: { id: ORDER_ID, status: "shipped" },
          then: [{ text: `${ORDER_ID} is now shipped.` }],
          onError: [{ text: `I did not change ${ORDER_ID}: the update was declined, so nothing happened.` }],
        },
      ],
    },
  ],
  bestPractice:
    "A host tool marked confirm: true must pause exactly where the real ConfirmationTray would, before run() ever executes, so a rejection always yields the library's own \"The user declined to run this tool\" error and never a partially applied change.",
};
