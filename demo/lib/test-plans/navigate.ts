import type { Spec } from "vexa/protocol";
import type { HostToolDescriptor } from "vexa/react";
import type { Scenario } from "@/lib/scenarios/types";

const ROUTES = ["/", "/orders", "/settings", "/tests"] as const;

const navigateTool: HostToolDescriptor = {
  name: "navigate",
  description: "Open one of the admin pages: / (overview), /orders, /settings, or /tests.",
  inputSchema: {
    type: "object",
    properties: { to: { type: "string", enum: ROUTES } },
    required: ["to"],
    additionalProperties: false,
  },
};

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
  title: "Model navigates the admin",
  controlPath: "user prompt → navigate host tool → router.push → /tools/navigate",
  page: "/",
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
  hostTools: [navigateTool],
  tools: {
    navigate: (input) => {
      const to = typeof input.to === "string" ? input.to : "/";
      return { ok: true, summary: `Opened ${to}`, data: { path: to } };
    },
  },
  script: [{ user: "Open the settings page", expectTools: ["navigate"], expectText: /./ }],
  bestPractice:
    "A host tool that only changes the visible route needs a one-line description naming every valid destination (\"Open one of the admin pages: / (overview), /orders, /settings, or /tests\"); the model then calls it directly instead of reasoning about which page shows what.",
};
