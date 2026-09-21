import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { ModelRegistry } from "vexa/server";

type ModelSpec = { id: string; name: string; maxTokens: number };
type Provider = { create: (id: string) => LanguageModel; models: readonly ModelSpec[]; provider: string };

const QWEN_BASE_URL = "https://maas.qwencloudapi.com/compatible-mode/v1";
const QWEN_MODELS: readonly ModelSpec[] = [
  { id: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash (QwenCloud)", maxTokens: 128_000 },
  { id: "qwen3.8-flash", name: "Qwen 3.8 Flash (QwenCloud)", maxTokens: 128_000 },
];
const GOOGLE_MODELS: readonly ModelSpec[] = [{ id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite (AI Studio)", maxTokens: 1_000_000 }];

function qwenProvider(apiKey: string): Provider {
  const client = createOpenAICompatible({ name: "qwencloud", baseURL: QWEN_BASE_URL, apiKey });
  return { create: (id) => client(id), models: QWEN_MODELS, provider: "qwen" };
}

function googleProvider(apiKey: string): Provider {
  const client = createGoogleGenerativeAI({ apiKey });
  return { create: (id) => client(id), models: GOOGLE_MODELS, provider: "google" };
}

const PROVIDER_KEYS: ReadonlyArray<[env: string, build: (key: string) => Provider]> = [
  ["QWEN_API_KEY", qwenProvider],
  ["GOOGLE_GENERATIVE_AI_API_KEY", googleProvider],
];

/** Every provider whose key is in examples/shop-admin/.env.local, QwenCloud first; the first entry is the default model. */
export function trialModels(): ModelRegistry {
  const providers = PROVIDER_KEYS.flatMap(([env, build]) => (process.env[env] ? [build(process.env[env] as string)] : []));
  if (providers.length === 0) throw new Error("Set QWEN_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in examples/shop-admin/.env.local");
  return Object.fromEntries(
    providers.flatMap(({ create, models, provider }) => models.map(({ id, name, maxTokens }) => [id, { model: () => create(id), name, provider, maxTokens }])),
  );
}

export const trialProviderOptions = { qwencloud: { enable_thinking: false } };
