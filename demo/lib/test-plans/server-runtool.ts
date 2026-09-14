import type { Spec } from "vexa/protocol";
import { ORDERS, findOrder } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const order = findOrder(ORDERS, "C-1042")!;
const forwardedInput = { id: order.id };
const forwardedMessage = `⟦action⟧ runTool get_order ${JSON.stringify(forwardedInput)}`;

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: order.id, description: "get_order is a server tool. The button names it directly; runTool forwards to the model because no host tool by that name exists." },
      children: ["kv", "details-btn"],
    },
    kv: {
      type: "KeyValue",
      props: {
        pairs: [
          { label: "Order", value: order.id },
          { label: "Customer", value: order.customer },
        ],
        size: "sm",
      },
    },
    "details-btn": {
      type: "Button",
      props: { label: "Full order details (server)", variant: "secondary" },
      on: { press: [{ action: "runTool", params: { name: "get_order", input: forwardedInput } }] },
    },
  },
};

export const scenario: Scenario = {
  id: "server-runtool",
  title: "Spec button names a server tool",
  controlPath: "Button.on.press → runTool get_order → not a host tool → sendToChat(⟦action⟧ runTool get_order …) → model calls get_order",
  page: "/orders",
  fixture: { spec },
  script: [
    { press: "details-btn", deferSend: true },
    { expectSentToChat: forwardedMessage },
    { user: forwardedMessage, expectTools: ["get_order"], expectText: new RegExp(order.id) },
  ],
  bestPractice:
    "When a spec button names a tool the client has no headless implementation for, runTool forwards it to the model as a literal ⟦action⟧ runTool <name> <input> message instead of failing silently; the server only has to know the tool name (it already does, via config.tools) for the round trip to work, so buttons can target server tools without the client ever declaring them as host tools.",
};
