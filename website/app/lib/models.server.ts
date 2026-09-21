import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import type { ModelRegistry } from "vexa/server";

type ModelSpec = { id: string; name: string; maxTokens: number };
type Provider = { create: (id: string) => LanguageModel; models: readonly ModelSpec[]; provider: string };

const QWEN_BASE_URL = "https://maas.qwencloudapi.com/compatible-mode/v1";
const QWEN_MODELS: readonly ModelSpec[] = [
  { id: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash (QwenCloud)", maxTokens: 128_000 },
  { id: "qwen3.8-flash", name: "Qwen 3.8 Flash (QwenCloud)", maxTokens: 128_000 },
];

const OPENROUTER_MODELS: readonly ModelSpec[] = [
  { id: "google/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", maxTokens: 1_000_000 },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (thinking)", maxTokens: 1_000_000 },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", maxTokens: 200_000 },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", maxTokens: 128_000 },
];

function qwenProvider(apiKey: string): Provider {
  const client = createOpenAICompatible({ name: "qwencloud", baseURL: QWEN_BASE_URL, apiKey });
  return { create: (id) => client(id), models: QWEN_MODELS, provider: "qwen" };
}

function openRouterProvider(apiKey: string): Provider {
  const client = createOpenRouter({
    apiKey,
    compatibility: "strict",
    appName: process.env.OPENROUTER_APP_TITLE ?? "Vexa playground",
    appUrl: process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3002",
  });
  return { create: (id) => client(id), models: OPENROUTER_MODELS, provider: "openrouter" };
}

const PROVIDER_KEYS: ReadonlyArray<[env: string, build: (key: string) => Provider]> = [
  ["QWEN_API_KEY", qwenProvider],
  ["OPENROUTER_API_KEY", openRouterProvider],
];

function configuredProviders(): Provider[] {
  return PROVIDER_KEYS.flatMap(([env, build]) => {
    const key = process.env[env];
    return key ? [build(key)] : [];
  });
}

/** Every provider whose key is in website/.env.local, QwenCloud first; the first entry (DeepSeek V4 Flash) is the playground's default model. */
export function playgroundModels(): ModelRegistry {
  const providers = configuredProviders();
  if (providers.length === 0) throw new Error("Set QWEN_API_KEY or OPENROUTER_API_KEY in website/.env.local");
  return Object.fromEntries(
    providers.flatMap(({ create, models, provider }) => models.map(({ id, name, maxTokens }) => [id, { model: () => create(id), name, provider, maxTokens }])),
  );
}

/** QwenCloud models think before every reply unless enable_thinking is false; the playground keeps it off. */
export const playgroundProviderOptions = {
  openrouter: { reasoning: { effort: "medium" } },
  qwencloud: { enable_thinking: false },
};
