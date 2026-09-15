import type { LanguageModel } from "ai";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import type { Spec, SpecPatch } from "vexa/protocol";
import { MOCK_MODEL_ID } from "./mock-model-id";

export { MOCK_MODEL_ID };

type LanguageModelV3 = Extract<LanguageModel, { specificationVersion: "v3" }>;
type LanguageModelV3CallOptions = Parameters<LanguageModelV3["doStream"]>[0];
type LanguageModelV3Prompt = LanguageModelV3CallOptions["prompt"];
type LanguageModelV3StreamPart = Awaited<ReturnType<LanguageModelV3["doStream"]>>["stream"] extends ReadableStream<infer Part> ? Part : never;
type ToolMessageContent = Extract<LanguageModelV3Prompt[number], { role: "tool" }>["content"][number];
type LanguageModelV3ToolResultOutput = Extract<ToolMessageContent, { type: "tool-result" }>["output"];

export type MockContinuation = MockStep[] | ((output: unknown) => MockStep[]);

export type MockToolStep = { tool: string; input: Record<string, unknown>; then: MockContinuation; onError?: MockContinuation };

export type MockStep = { reasoning: string } | { text: string } | { spec: Spec } | { patch: SpecPatch[] } | MockToolStep;

/** One scripted reply of the mock model: `match` runs against the last user message, `steps` may derive from it, a `tool` step must close its array and continue through `then` / `onError`. */
export type MockTurn = {
  match: RegExp | ((prompt: string) => boolean);
  steps: MockStep[] | ((prompt: string) => MockStep[]);
};

/** What a scripted model plays: the turns it can match and the prompts it lists when nothing matches. */
export type MockScript = { turns: MockTurn[]; prompts: string[] };

export function matchesMockTurn(turn: MockTurn, text: string): boolean {
  return typeof turn.match === "function" ? turn.match(text) : turn.match.test(text);
}

export function mockTurnSteps(turn: MockTurn, prompt: string): MockStep[] {
  return typeof turn.steps === "function" ? turn.steps(prompt) : turn.steps;
}

const CHUNK_DELAY_MS = 60;
const FENCE_LINE = /^⟦[^⟧]*⟧$/;
const DECLINED_ERROR = "The user declined to run this tool";
const NO_SCRIPT_INTRO = "The mock model has no script for this message. It only replies to these prompts (or pick a real model):";
const OFF_SCRIPT_TEXT = "The mock model received a tool result it did not ask for, so it stops here.";

const ZERO_USAGE = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

type ToolResult = { toolName: string; output: unknown };

let toolCallCounter = 0;

function nextToolCallId(toolName: string) {
  toolCallCounter += 1;
  return `mock-${toolName}-${toolCallCounter}`;
}

function isToolStep(step: MockStep): step is MockToolStep {
  return "tool" in step;
}

function words(text: string) {
  return text.split(/(?<=\s)/);
}

function lastUserText(prompt: LanguageModelV3Prompt): { text: string; index: number } {
  for (let index = prompt.length - 1; index >= 0; index -= 1) {
    const message = prompt[index];
    if (message.role !== "user") continue;
    const text = message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n");
    return { text, index };
  }
  return { text: "", index: -1 };
}

function unfence(value: string): string {
  const lines = value.split("\n");
  if (lines.length >= 2 && FENCE_LINE.test(lines[0]) && FENCE_LINE.test(lines[lines.length - 1])) return lines.slice(1, -1).join("\n");
  return value;
}

function parseJsonOrText(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseToolOutput(output: LanguageModelV3ToolResultOutput): unknown {
  if (output.type === "text") return parseJsonOrText(unfence(output.value));
  if (output.type === "json") return output.value;
  if (output.type === "execution-denied") return { ok: false, error: output.reason ?? DECLINED_ERROR };
  if (output.type === "error-text") return { ok: false, error: output.value };
  if (output.type === "error-json") return { ok: false, error: output.value };
  const text = output.value
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n");
  return parseJsonOrText(unfence(text));
}

function toolResultsAfter(prompt: LanguageModelV3Prompt, index: number): ToolResult[] {
  const results: ToolResult[] = [];
  for (const message of prompt.slice(index + 1)) {
    if (message.role !== "tool") continue;
    for (const part of message.content) {
      if (part.type === "tool-result") results.push({ toolName: part.toolName, output: parseToolOutput(part.output) });
    }
  }
  return results;
}

function isErrorOutput(output: unknown): boolean {
  return typeof output === "object" && output !== null && (output as { ok?: unknown }).ok === false;
}

function continuationSteps(continuation: MockContinuation, output: unknown): MockStep[] {
  return typeof continuation === "function" ? continuation(output) : continuation;
}

function continueAfterTool(step: MockToolStep, output: unknown): MockStep[] {
  if (isErrorOutput(output) && step.onError) return continuationSteps(step.onError, output);
  return continuationSteps(step.then, output);
}

function assertToolStepIsLast(steps: MockStep[]) {
  const toolIndex = steps.findIndex(isToolStep);
  if (toolIndex !== -1 && toolIndex !== steps.length - 1) {
    throw new Error(`Mock script: a tool step ("${(steps[toolIndex] as MockToolStep).tool}") must be the last step of its array; put the rest in "then"`);
  }
}

function remainingSteps(turn: MockTurn, prompt: string, results: ToolResult[]): MockStep[] | null {
  let steps = mockTurnSteps(turn, prompt);
  for (const result of results) {
    assertToolStepIsLast(steps);
    const toolStep = steps.find(isToolStep);
    if (!toolStep) return null;
    steps = continueAfterTool(toolStep, result.output);
  }
  assertToolStepIsLast(steps);
  return steps;
}

function findTurn(script: MockScript, text: string): MockTurn | undefined {
  return script.turns.find((turn) => matchesMockTurn(turn, text));
}

function noScriptText(script: MockScript): string {
  const prompts = script.prompts.map((prompt) => `- ${prompt}`);
  return [NO_SCRIPT_INTRO, "", ...prompts].join("\n");
}

function hasTool(options: LanguageModelV3CallOptions, toolName: string) {
  return options.tools?.some((tool) => tool.type === "function" && tool.name === toolName) ?? false;
}

function specToPatch(spec: Spec): SpecPatch[] {
  const patch: SpecPatch[] = [{ op: "add", path: "/root", value: spec.root }];
  if (spec.state) patch.push({ op: "add", path: "/state", value: spec.state });
  for (const [id, element] of Object.entries(spec.elements)) patch.push({ op: "add", path: `/elements/${id}`, value: element });
  return patch;
}

function reasoningChunks(id: string, text: string): LanguageModelV3StreamPart[] {
  return [
    { type: "reasoning-start", id },
    ...words(text).map((delta): LanguageModelV3StreamPart => ({ type: "reasoning-delta", id, delta })),
    { type: "reasoning-end", id },
  ];
}

function textChunks(id: string, text: string): LanguageModelV3StreamPart[] {
  return [
    { type: "text-start", id },
    ...words(text).map((delta): LanguageModelV3StreamPart => ({ type: "text-delta", id, delta })),
    { type: "text-end", id },
  ];
}

function patchChunks(id: string, patch: SpecPatch[]): LanguageModelV3StreamPart[] {
  return [
    { type: "text-start", id },
    ...patch.map((line): LanguageModelV3StreamPart => ({ type: "text-delta", id, delta: JSON.stringify(line) + "\n" })),
    { type: "text-end", id },
  ];
}

function toolCallChunks(step: MockToolStep, callId: string): LanguageModelV3StreamPart[] {
  return [
    { type: "tool-input-start", id: callId, toolName: step.tool },
    { type: "tool-input-end", id: callId },
    { type: "tool-call", toolCallId: callId, toolName: step.tool, input: JSON.stringify(step.input) },
  ];
}

function finish(reason: "stop" | "tool-calls"): LanguageModelV3StreamPart {
  return { type: "finish", usage: ZERO_USAGE, finishReason: { unified: reason, raw: reason } };
}

function streamStart(): LanguageModelV3StreamPart {
  return { type: "stream-start", warnings: [] };
}

function textOnlyStream(text: string): LanguageModelV3StreamPart[] {
  return [streamStart(), ...textChunks("t0", text), finish("stop")];
}

function stepChunks(step: MockStep, ordinal: number): LanguageModelV3StreamPart[] {
  if ("reasoning" in step) return reasoningChunks(`r${ordinal}`, step.reasoning);
  if ("text" in step) return textChunks(`t${ordinal}`, step.text);
  if ("spec" in step) return patchChunks(`s${ordinal}`, specToPatch(step.spec));
  if ("patch" in step) return patchChunks(`p${ordinal}`, step.patch);
  return toolCallChunks(step, nextToolCallId(step.tool));
}

function scriptedStream(steps: MockStep[], options: LanguageModelV3CallOptions): LanguageModelV3StreamPart[] {
  const chunks: LanguageModelV3StreamPart[] = [streamStart()];
  steps.forEach((step, ordinal) => {
    if (isToolStep(step) && !hasTool(options, step.tool)) {
      chunks.push(...textChunks(`missing${ordinal}`, `(tool ${step.tool} is not available on this page)`));
      return;
    }
    chunks.push(...stepChunks(step, ordinal));
  });
  const endsWithToolCall = chunks.some((chunk) => chunk.type === "tool-call");
  chunks.push(finish(endsWithToolCall ? "tool-calls" : "stop"));
  return chunks;
}

function chunksFor(script: MockScript, options: LanguageModelV3CallOptions): LanguageModelV3StreamPart[] {
  const { text, index } = lastUserText(options.prompt);
  const turn = findTurn(script, text);
  if (!turn) return textOnlyStream(noScriptText(script));
  const results = toolResultsAfter(options.prompt, index);
  const steps = remainingSteps(turn, text, results);
  if (!steps) return textOnlyStream(OFF_SCRIPT_TEXT);
  return scriptedStream(steps, options);
}

/** A LanguageModel that plays `script` through the real handler: no API key, no cost, the same reply every time. */
export function createScriptedModel(script: MockScript) {
  return new MockLanguageModelV3({
    provider: "vexa-mock",
    modelId: MOCK_MODEL_ID,
    doStream: async (options) => ({
      stream: simulateReadableStream({ chunks: chunksFor(script, options), chunkDelayInMs: CHUNK_DELAY_MS }),
    }),
  });
}
