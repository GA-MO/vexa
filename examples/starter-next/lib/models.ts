import { createAnthropic } from "@ai-sdk/anthropic";
import { createScriptedModel, MOCK_MODEL_ID } from "vexa/mock";
import type { ModelRegistry } from "vexa/server";
import { MOCK_SCRIPT } from "./mock";

const MOCK: ModelRegistry = {
  [MOCK_MODEL_ID]: { model: () => createScriptedModel(MOCK_SCRIPT), name: "Mock (scripted, free)", provider: "vexa-mock", maxTokens: 8_000 },
};

/** The registry GET /api/chat publishes; its first entry is the default model. The key is read on the first request, not at build time. */
export function models(): ModelRegistry {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return MOCK;
  const anthropic = createAnthropic({ apiKey });
  return {
    "claude-sonnet-4": { model: () => anthropic("claude-sonnet-4-20250514"), name: "Claude Sonnet 4", maxTokens: 200_000 },
    ...MOCK,
  };
}
