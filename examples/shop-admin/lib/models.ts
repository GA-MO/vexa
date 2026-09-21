import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import type { ModelRegistry } from "vexa/server";
import { MOCK_MODEL_ENTRY } from "./mock-model";

type ModelSpec = { id: string; name: string; maxTokens: number };

const OPENROUTER_MODELS: readonly ModelSpec[] = [
  { id: "google/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", maxTokens: 1_000_000 },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (thinking)", maxTokens: 1_000_000 },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", maxTokens: 200_000 },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", maxTokens: 128_000 },
];

const ANTHROPIC_MODELS: readonly ModelSpec[] = [
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", maxTokens: 200_000 },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", maxTokens: 200_000 },
];

const GROQ_MODELS: readonly ModelSpec[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)", maxTokens: 128_000 },
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Groq)", maxTokens: 128_000 },
];

const DEEPSEEK_MODELS: readonly ModelSpec[] = [
  { id: "deepseek-flash", name: "DeepSeek Flash", maxTokens: 128_000 },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", maxTokens: 128_000 },
];

const QWEN_BASE_URL = "https://maas.qwencloudapi.com/compatible-mode/v1";
const QWEN_MODELS: readonly ModelSpec[] = [
  { id: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash (QwenCloud)", maxTokens: 128_000 },
  { id: "qwen3.8-flash", name: "Qwen 3.8 Flash (QwenCloud)", maxTokens: 128_000 },
  { id: "qwen3.7-plus", name: "Qwen 3.7 Plus (QwenCloud)", maxTokens: 128_000 },
];

const GOOGLE_MODELS: readonly ModelSpec[] = [
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite (AI Studio)", maxTokens: 1_000_000 },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite (AI Studio)", maxTokens: 1_000_000 },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (AI Studio)", maxTokens: 1_000_000 },
];

type Provider = { create: (id: string) => LanguageModel; models: readonly ModelSpec[]; provider: string };

function openRouterProvider(apiKey: string): Provider {
  const client = createOpenRouter({
    apiKey,
    compatibility: "strict",
    appName: process.env.OPENROUTER_APP_TITLE ?? "Vexa demo",
    appUrl: process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
  });
  return { create: (id) => client(id), models: OPENROUTER_MODELS, provider: "openrouter" };
}

function anthropicProvider(apiKey: string): Provider {
  const client = createAnthropic({ apiKey });
  return { create: (id) => client(id), models: ANTHROPIC_MODELS, provider: "anthropic" };
}

function groqProvider(apiKey: string): Provider {
  const client = createGroq({ apiKey });
  return { create: (id) => client(id), models: GROQ_MODELS, provider: "groq" };
}

function deepSeekProvider(apiKey: string): Provider {
  const client = createDeepSeek({ apiKey });
  return { create: (id) => client(id), models: DEEPSEEK_MODELS, provider: "deepseek" };
}

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
  ["DEEPSEEK_API_KEY", deepSeekProvider],
  ["GOOGLE_GENERATIVE_AI_API_KEY", googleProvider],
  ["GROQ_API_KEY", groqProvider],
  ["ANTHROPIC_API_KEY", anthropicProvider],
  ["OPENROUTER_API_KEY", openRouterProvider],
];

function configuredProviders(): Provider[] {
  const order = (process.env.VEXA_PROVIDERS ?? PROVIDER_KEYS.map(([env]) => env).join(",")).split(",");
  return order
    .map((env) => PROVIDER_KEYS.find(([name]) => name === env.trim()))
    .filter((entry): entry is [string, (key: string) => Provider] => Boolean(entry))
    .flatMap(([env, build]) => {
      const key = process.env[env];
      return key ? [build(key)] : [];
    });
}

/** Every provider whose key is set, in VEXA_PROVIDERS order (default: QwenCloud, DeepSeek, Google AI Studio, Groq, Anthropic, OpenRouter); the first entry is the default model. */
export function demoModels(): ModelRegistry {
  const providers = configuredProviders();
  if (providers.length === 0) throw new Error("Set ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, QWEN_API_KEY, DEEPSEEK_API_KEY or OPENROUTER_API_KEY in examples/shop-admin/.env.local");
  return {
    ...Object.fromEntries(
      providers.flatMap(({ create, models, provider }) =>
        models.map(({ id, name, maxTokens }) => [id, { model: () => create(id), name, provider, maxTokens }]),
      ),
    ),
    ...MOCK_MODEL_ENTRY,
  };
}

const QWEN_THINKING = process.env.VEXA_QWEN_THINKING === "1";

/** QwenCloud models think before every reply unless enable_thinking is false; the demo keeps it off (VEXA_QWEN_THINKING=1 turns it on). */
export const demoProviderOptions = {
  openrouter: { reasoning: { effort: "medium" } },
  qwencloud: { enable_thinking: QWEN_THINKING },
};
