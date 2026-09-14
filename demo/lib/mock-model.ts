import type { LanguageModelV3CallOptions, LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";

export const MOCK_MODEL_ID = "mock";

const REASONING_BEFORE_TOOL =
  "The user is asking about orders. I should read the current orders from the server before answering, so every number comes from a tool result.";
const REASONING_AFTER_TOOL =
  "The tool returned the rows. A short sentence plus a metric card will answer this.";
const ANSWER_TEXT = "Here is what the mock model found. ";
const CHUNK_DELAY_MS = 60;
const TOOL_CALL_ID = "mock-call-get-orders";

const SPEC_LINES = [
  { op: "add", path: "/root", value: "mock-root" },
  {
    op: "add",
    path: "/elements/mock-root",
    value: { type: "Card", props: { title: "Orders (mock)", description: "Streamed by the mock model at no cost" }, children: ["mock-metric"] },
  },
  {
    op: "add",
    path: "/elements/mock-metric",
    value: { type: "Metric", props: { label: "Orders", value: "3", trend: "up", delta: "+1 today" }, children: [] },
  },
];

const ZERO_USAGE = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

function words(text: string) {
  return text.split(/(?<=\s)/);
}

function reasoningChunks(id: string, text: string): LanguageModelV3StreamPart[] {
  return [
    { type: "reasoning-start", id },
    ...words(text).map((delta): LanguageModelV3StreamPart => ({ type: "reasoning-delta", id, delta })),
    { type: "reasoning-end", id },
  ];
}

function specChunks(id: string): LanguageModelV3StreamPart[] {
  return SPEC_LINES.map((line): LanguageModelV3StreamPart => ({
    type: "text-delta",
    id,
    delta: JSON.stringify(line) + "\n",
  }));
}

function finish(reason: "stop" | "tool-calls"): LanguageModelV3StreamPart {
  return { type: "finish", usage: ZERO_USAGE, finishReason: { unified: reason, raw: reason } };
}

function hasToolResult(options: LanguageModelV3CallOptions) {
  return options.prompt.some(
    (message) => message.role === "tool" || (message.role === "assistant" && message.content.some((part) => part.type === "tool-call")),
  );
}

function canCall(options: LanguageModelV3CallOptions, toolName: string) {
  return options.tools?.some((tool) => tool.type === "function" && tool.name === toolName) ?? false;
}

function firstStep(options: LanguageModelV3CallOptions): LanguageModelV3StreamPart[] {
  if (!canCall(options, "get_orders")) return answerStep();
  return [
    { type: "stream-start", warnings: [] },
    ...reasoningChunks("r1", REASONING_BEFORE_TOOL),
    { type: "tool-input-start", id: TOOL_CALL_ID, toolName: "get_orders" },
    { type: "tool-input-end", id: TOOL_CALL_ID },
    {
      type: "tool-call",
      toolCallId: TOOL_CALL_ID,
      toolName: "get_orders",
      input: JSON.stringify({ status: null, city: null, limit: 3 }),
    },
    finish("tool-calls"),
  ];
}

function answerStep(): LanguageModelV3StreamPart[] {
  return [
    { type: "stream-start", warnings: [] },
    ...reasoningChunks("r2", REASONING_AFTER_TOOL),
    { type: "text-start", id: "t1" },
    ...words(ANSWER_TEXT).map((delta): LanguageModelV3StreamPart => ({ type: "text-delta", id: "t1", delta })),
    { type: "text-delta", id: "t1", delta: "\n\n" },
    ...specChunks("t1"),
    { type: "text-end", id: "t1" },
    finish("stop"),
  ];
}

export function createMockModel() {
  return new MockLanguageModelV3({
    provider: "vexa-mock",
    modelId: MOCK_MODEL_ID,
    doStream: async (options) => ({
      stream: simulateReadableStream({
        chunks: hasToolResult(options) ? answerStep() : firstStep(options),
        chunkDelayInMs: CHUNK_DELAY_MS,
      }),
    }),
  });
}
