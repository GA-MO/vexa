import type { Scenario } from "@/lib/scenarios/types";

export const scenario: Scenario = {
  id: "smoke",
  measures: "steering",
  kind: "check",
  title: "Plain text reply without UI",
  controlPath: "user prompt → /api/chat → text only",
  page: "/",
  script: [{ user: "Reply with one sentence and no UI", expectNoTools: true, expectText: /./ }],
  mock: [{ match: /one sentence and no UI/i, steps: [{ text: "Here is one sentence, with no UI attached." }] }],
  bestPractice:
    "A prompt that asks for a plain answer must come back as one text part: no tool call, no spec, so the chat stays a conversation until UI is worth it.",
};
