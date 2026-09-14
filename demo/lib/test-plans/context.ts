import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "context", description: "The assistant answers from page context alone: no tool call, no memorized data." },
      children: ["result"],
    },
    result: {
      type: "KeyValue",
      props: { pairs: { $state: "/display/pairs" }, size: "sm" },
    },
  },
};

const OVERSIZED_CONTEXT = { path: "/orders", note: "x".repeat(4_100) };

export const scenario: Scenario = {
  id: "context",
  title: "Model answers from page context",
  controlPath: "contextSchema (route, filters, selectedOrderId) → persona → answer with no tool call",
  page: "/orders",
  fixture: {
    spec,
    state: {
      display: {
        pairs: [
          { label: "path", value: "/orders" },
          { label: "selectedOrderId", value: "C-1042" },
          { label: "filters.status", value: "all" },
          { label: "filters.search", value: "" },
        ],
      },
    },
  },
  context: {
    path: "/orders",
    selectedOrderId: "C-1042",
    filters: { status: "all", search: "" },
  },
  script: [
    { user: "Which order is currently selected, and what page am I on?", expectNoTools: true, expectText: /C-1042/ },
    {
      request: {
        method: "POST",
        path: "/api/chat",
        body: {
          messages: [{ id: "oversized-context", role: "user", parts: [{ type: "text", text: "hi" }] }],
          context: OVERSIZED_CONTEXT,
        },
      },
      expectStatus: 400,
      expectBody: /context must serialize to 4 KB or less/,
    },
  ],
  bestPractice:
    "State the context fields the persona can quote by name (\"'the selected order' is context.selectedOrderId\") so the model answers state-about-the-page questions for free, without spending a tool call on data already sitting in context; the server independently caps context at 4 KB so a host can never balloon every turn's prompt.",
};
