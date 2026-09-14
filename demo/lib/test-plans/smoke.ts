import type { Scenario } from "@/lib/scenarios/types";

export const scenario: Scenario = {
  id: "smoke",
  title: "Plain text reply without UI",
  controlPath: "user prompt → /api/chat → text only",
  page: "/",
  script: [{ user: "Reply with one sentence and no UI", expectNoTools: true, expectText: /./ }],
  bestPractice:
    "A prompt that asks for a plain answer must come back as one text part: no tool call, no spec, so the chat stays a conversation until UI is worth it.",
};
