import type { Spec } from "vexa/protocol";
import { hostToolDescriptor } from "@/lib/shop/host-tools";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "navigate", description: "A read host tool that changes the route with no page reload." },
      children: ["result"],
    },
    result: {
      type: "KeyValue",
      props: { pairs: { $state: "/display/pairs" }, size: "sm" },
    },
  },
};

export const scenario: Scenario = {
  id: "navigate",
  measures: "steering",
  title: "Model navigates the admin",
  controlPath: "user prompt → navigate host tool → router.push → /tools/navigate",
  page: "/",
  docs: "host/host-tools",
  fixture: {
    spec,
    state: {
      display: {
        pairs: [
          { label: "tool", value: "navigate" },
          { label: "to", value: "/settings" },
          { label: "/tools/navigate", value: '{ "path": "/settings" }' },
        ],
      },
    },
  },
  context: { path: "/" },
  hostTools: [hostToolDescriptor("navigate")],
  tools: {
    navigate: (input) => {
      const to = typeof input.to === "string" ? input.to : "/";
      return { ok: true, summary: `Opened ${to}`, data: { path: to } };
    },
  },
  script: [{ user: "Open the settings page", expectTools: ["navigate"], expectText: /./ }],
  mock: [
    {
      match: /settings page/i,
      steps: [
        { reasoning: "The user wants a different page. navigate lists /settings as a valid destination, so one call does it." },
        { tool: "navigate", input: { to: "/settings" }, then: [{ text: "Opened the settings page." }] },
      ],
    },
  ],
  bestPractice:
    "A host tool that only changes the visible route needs a one-line description naming every valid destination (\"Open one of the admin pages: / (overview), /orders, /settings, or /guides\"); the model then calls it directly instead of reasoning about which page shows what.",
};
