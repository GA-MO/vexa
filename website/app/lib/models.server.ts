import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ModelRegistry } from "vexa/server";

const PLAYGROUND_MODELS = [
  { id: "google/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", maxTokens: 1_000_000 },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (thinking)", maxTokens: 1_000_000 },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", maxTokens: 200_000 },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", maxTokens: 128_000 },
] as const;

function openRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing in website/.env.local");
  return createOpenRouter({
    apiKey,
    compatibility: "strict",
    appName: process.env.OPENROUTER_APP_TITLE ?? "Vexa playground",
    appUrl: process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3002",
  });
}

export function playgroundModels(): ModelRegistry {
  const provider = openRouter();
  return Object.fromEntries(
    PLAYGROUND_MODELS.map(({ id, name, maxTokens }) => [id, { model: () => provider(id), name, maxTokens }]),
  );
}

export const playgroundProviderOptions = {
  openrouter: { reasoning: { effort: "medium" } },
};
