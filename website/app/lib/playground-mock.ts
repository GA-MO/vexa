import type { ChatSuggestion } from "vexa/chat";
import { COMPOSED_EXAMPLES } from "vexa/examples";
import { createVexaHandler } from "vexa/server";
import { serveChatInBrowser } from "../../../examples/shared/browser-chat";
import { createScriptedModel, MOCK_MODEL_ID, type MockTurn } from "../../../examples/shared/mock-model";

const SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

function exactMatch(prompt: string): RegExp {
  return new RegExp(`^\\s*${prompt.replace(SPECIAL_CHARACTERS, "\\$&")}\\s*$`);
}

const TURNS: MockTurn[] = COMPOSED_EXAMPLES.map((example) => ({
  match: exactMatch(example.prompt),
  steps: [{ text: example.prose }, { spec: example.spec }],
}));

/** The composed examples double as the playground's scripted replies on a static host: each suggestion plays its example. */
export const PLAYGROUND_MOCK_SUGGESTIONS: readonly ChatSuggestion[] = COMPOSED_EXAMPLES.map((example) => ({ label: example.title, prompt: example.prompt }));

const PERSONA = "You are the Vexa playground assistant.";

let installed = false;

export function servePlaygroundMockInBrowser() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const handler = createVexaHandler({
    persona: PERSONA,
    models: {
      [MOCK_MODEL_ID]: {
        model: () => createScriptedModel({ turns: TURNS, prompts: COMPOSED_EXAMPLES.map((example) => example.prompt) }),
        name: "Mock (scripted, free)",
        provider: "vexa-mock",
        maxTokens: 8_000,
      },
    },
  });
  serveChatInBrowser(handler);
}
