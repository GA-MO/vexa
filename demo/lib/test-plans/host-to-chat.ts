import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const ORDER_ID = "C-1042";
const ACTION_MESSAGE_PREFIX = "⟦action⟧";

function forwardedActionText(name: string, input: unknown) {
  return `${ACTION_MESSAGE_PREFIX} runTool ${name} ${JSON.stringify(input ?? {})}`;
}

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["summary", "ask-order"] },
    summary: { type: "Text", props: { content: `Order ${ORDER_ID} · Napat Srisuwan · pending`, muted: true } },
    "ask-order": {
      type: "Button",
      props: { label: "Ask about this order", variant: "secondary" },
      on: { press: [{ action: "runTool", params: { name: "get_order", input: { id: ORDER_ID } } }] },
    },
  },
};

const FORWARDED_TEXT = forwardedActionText("get_order", { id: ORDER_ID });

export const scenario: Scenario = {
  id: "host-to-chat",
  title: "App UI asks the chat about an order",
  controlPath: "app Button → useVexaHost().runTool (unknown to the client) → sendToChat → user turn → server tool",
  page: `/orders/${ORDER_ID}`,
  fixture: { spec },
  script: [
    { press: "ask-order", deferSend: true },
    { expectSentToChat: new RegExp(`runTool get_order.*${ORDER_ID}`) },
    { user: FORWARDED_TEXT, expectTools: ["get_order"], expectText: new RegExp(ORDER_ID) },
  ],
  bestPractice:
    "A host button that needs a capability the client does not have registered should call runTool with the real server tool's name; the same 'unknown tool forwards to sendToChat' path that specs use also carries the app's own buttons into the chat, so there is only one gate (host.hasTool) to reason about.",
};
