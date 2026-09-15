import { createScriptedModel, MOCK_MODEL_ID } from "../../shared/mock-model";
import { SCENARIOS } from "@/lib/scenarios";
import { allMockPrompts, mockTurnsOf } from "@/lib/scenarios/mock-prompts";

export { MOCK_MODEL_ID };

export function createMockModel() {
  return createScriptedModel({ turns: SCENARIOS.flatMap(mockTurnsOf), prompts: allMockPrompts(SCENARIOS) });
}
