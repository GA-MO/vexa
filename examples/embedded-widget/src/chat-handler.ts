import { createVexaHandler } from "vexa/server";
import { createScriptedModel, MOCK_MODEL_ID } from "../../shared/mock-model";
import { WIDGET_MOCK_SCRIPT } from "./guides/mock-script";

const PERSONA = "You are the help assistant of Acme Notes, a note-taking app.";

/** The chat route: one scripted mock model, no key. The Vite dev server mounts it; the static build runs it in the browser. */
export function createWidgetChatHandler() {
  return createVexaHandler({
    models: { [MOCK_MODEL_ID]: { model: () => createScriptedModel(WIDGET_MOCK_SCRIPT), name: "Mock (scripted, free)", provider: "vexa-mock", maxTokens: 8_000 } },
    persona: PERSONA,
  });
}
