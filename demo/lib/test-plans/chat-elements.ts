import { CHAT_ELEMENT_MESSAGES, COMPOSED_EXAMPLES } from "vexa/examples";
import type { Scenario } from "@/lib/scenarios/types";

export { CHAT_ELEMENT_MESSAGES };

const dashboardSpec = COMPOSED_EXAMPLES.find((example) => example.id === "dashboard")?.spec;

export const scenario: Scenario = {
  id: "chat-elements",
  title: "Every chat element at 340 and 600 px",
  controlPath: "fixed messages → AssistantMessage / UserMessage → SpecView",
  page: "/tests/chat-elements",
  fixture: dashboardSpec ? { spec: dashboardSpec } : undefined,
  script: [],
  bestPractice:
    "Review every message part from fixed messages before touching a model: tool states, approvals, notices, markdown, and a spec must all fit a 340 px column without clipping.",
};
