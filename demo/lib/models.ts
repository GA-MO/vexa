import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ModelRegistry } from "vexa/server";
import { createMockModel, MOCK_MODEL_ID } from "./mock-model";

const DEMO_MODELS = [
  { id: "google/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", maxTokens: 1_000_000 },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (thinking)", maxTokens: 1_000_000 },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", maxTokens: 200_000 },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", maxTokens: 128_000 },
] as const;

let openRouterClient: ReturnType<typeof createOpenRouter> | null = null;

function openRouter() {
  if (openRouterClient) return openRouterClient;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing in demo/.env.local");
  openRouterClient = createOpenRouter({
    apiKey,
    compatibility: "strict",
    appName: process.env.OPENROUTER_APP_TITLE ?? "Vexa demo",
    appUrl: process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
  });
  return openRouterClient;
}

export function demoModels(): ModelRegistry {
  return {
    ...Object.fromEntries(
      DEMO_MODELS.map(({ id, name, maxTokens }) => [id, { model: () => openRouter()(id), name, maxTokens }]),
    ),
    [MOCK_MODEL_ID]: { model: createMockModel, name: "Mock (scripted, free)", provider: "vexa-mock", maxTokens: 8_000 },
  };
}

export const demoProviderOptions = {
  openrouter: { reasoning: { effort: "medium" } },
};
