import type { ModelRegistry } from "vexa/server";
import { createScriptedModel, MOCK_MODEL_ID } from "vexa/mock";
import { SCENARIOS } from "@/lib/scenarios";
import { allMockPrompts, mockTurnsOf } from "@/lib/scenarios/mock-prompts";

export { MOCK_MODEL_ID };

export function createMockModel() {
  return createScriptedModel({ turns: SCENARIOS.flatMap(mockTurnsOf), prompts: allMockPrompts(SCENARIOS) });
}

/** The registry entry the picker shows as "Mock (scripted, free)"; the API route adds it next to the OpenRouter models, the static build offers only it. */
export const MOCK_MODEL_ENTRY: ModelRegistry = {
  [MOCK_MODEL_ID]: { model: createMockModel, name: "Mock (scripted, free)", provider: "vexa-mock", maxTokens: 8_000 },
};
