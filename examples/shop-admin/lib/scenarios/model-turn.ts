import { getToolName, isToolUIPart, readUIMessageStream, type UIMessage, type UIMessageChunk } from "ai";
import type { HostToolDescriptor } from "vexa/react";
import type { HeadlessHost } from "./driver";

export const BASE_URL = process.env.VEXA_DEMO_URL ?? "http://localhost:3001";
const SERVER_DEFAULT_MODEL = "server default";

export const MODEL = process.env.VEXA_SCENARIO_MODEL ?? SERVER_DEFAULT_MODEL;

function requestedModel(): string | undefined {
  return MODEL === SERVER_DEFAULT_MODEL ? undefined : MODEL;
}
export const DEBUG = process.env.VEXA_SCENARIO_DEBUG === "1";
export const MAX_ROUND_TRIPS = 6;

export type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

export type Turn = { tools: string[]; text: string; dataParts: string[]; toolInputs: Record<string, unknown>; errors: string[] };

export type ChatRequest = { context: Record<string, unknown>; hostTools: HostToolDescriptor[] };

/** The state one chat needs to talk to /api/chat the way useChat does: messages, the browser-side host and what every request carries. */
export type ChatSession = {
  chatId: string;
  messages: UIMessage[];
  host: HeadlessHost;
  seenToolCallIds: Set<string>;
  request: ChatRequest;
};

export function dataPartTypesOf(message: UIMessage | undefined): string[] {
  const types = (message?.parts ?? [])
    .map((part) => part.type)
    .filter((type) => type.startsWith("data-"));
  return [...new Set(types)];
}

function parseSseEvent(event: string): UIMessageChunk[] {
  const data = event
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("\n");
  if (!data || data === "[DONE]") return [];
  return [JSON.parse(data) as UIMessageChunk];
}

function sseChunkStream(body: ReadableStream<Uint8Array>): ReadableStream<UIMessageChunk> {
  const decoder = new TextDecoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, UIMessageChunk>({
      transform(bytes, controller) {
        buffer += decoder.decode(bytes, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) for (const chunk of parseSseEvent(event)) controller.enqueue(chunk);
      },
      flush(controller) {
        for (const chunk of parseSseEvent(buffer)) controller.enqueue(chunk);
      },
    }),
  );
}

export function lastAssistantMessage(session: ChatSession): UIMessage | undefined {
  const last = session.messages.at(-1);
  return last?.role === "assistant" ? last : undefined;
}

export function textOf(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function toolParts(message: UIMessage | undefined): ToolPart[] {
  return (message?.parts ?? []).filter((part): part is ToolPart => isToolUIPart(part));
}

export function upsertMessage(session: ChatSession, message: UIMessage) {
  const index = session.messages.findIndex((existing) => existing.id === message.id);
  if (index === -1) session.messages.push(message);
  else session.messages[index] = message;
}

function recordNewToolCalls(session: ChatSession, message: UIMessage, turn: Turn) {
  for (const part of toolParts(message)) {
    if (session.seenToolCallIds.has(part.toolCallId)) continue;
    session.seenToolCallIds.add(part.toolCallId);
    const name = getToolName(part);
    turn.tools.push(name);
    turn.toolInputs[name] = (part as { input?: unknown }).input;
  }
}

async function postChat(session: ChatSession, continuation: UIMessage | undefined): Promise<Response> {
  return fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: session.chatId,
      trigger: "submit-message",
      messageId: continuation?.id,
      messages: session.messages,
      model: requestedModel(),
      context: session.request.context,
      hostTools: session.request.hostTools,
    }),
  });
}

async function readAssistantMessage(response: Response, continuation: UIMessage | undefined, errors: string[]): Promise<UIMessage | undefined> {
  if (!response.body) {
    errors.push("Response had no body");
    return undefined;
  }
  let message: UIMessage | undefined;
  const stream = readUIMessageStream<UIMessage>({
    message: continuation,
    stream: sseChunkStream(response.body),
    onError: (error) => errors.push(error instanceof Error ? error.message : String(error)),
  });
  for await (const state of stream) message = state;
  return message;
}

export function withPart(message: UIMessage, toolCallId: string, next: ToolPart): UIMessage {
  return {
    ...message,
    parts: message.parts.map((part) => (isToolUIPart(part) && part.toolCallId === toolCallId ? next : part)),
  };
}

async function runPendingHostTools(session: ChatSession, message: UIMessage): Promise<{ message: UIMessage; ran: boolean }> {
  let next = message;
  let ran = false;
  for (const part of toolParts(message)) {
    const name = getToolName(part);
    if (part.state !== "input-available" || !session.host.hasTool(name)) continue;
    if (session.host.needsConfirm(name)) {
      session.host.requestConfirm({ toolCallId: part.toolCallId, name, input: part.input });
      continue;
    }
    const output = await session.host.runTool(name, part.input, { toolCallId: part.toolCallId, source: "model" });
    if (DEBUG) console.error(`[${name}]`, JSON.stringify(part.input), "→", JSON.stringify(output).slice(0, 1500));
    next = withPart(next, part.toolCallId, { ...part, state: "output-available", output } as ToolPart);
    ran = true;
  }
  return { message: next, ran };
}

export function hasPendingApproval(message: UIMessage) {
  return toolParts(message).some((part) => part.state === "approval-requested");
}

/** One model turn the way useChat runs it: post, stream, run the host tools the model called, post again until the model stops calling tools or asks for approval. `onSettled` sees every settled assistant message. */
export async function runModelTurnRaw(session: ChatSession, continueLast: boolean, onSettled?: (message: UIMessage) => void): Promise<Turn> {
  const turn: Turn = { tools: [], text: "", dataParts: [], toolInputs: {}, errors: [] };
  let continuation = continueLast ? lastAssistantMessage(session) : undefined;
  for (let roundTrip = 0; roundTrip < MAX_ROUND_TRIPS; roundTrip += 1) {
    const response = await postChat(session, continuation);
    if (!response.ok) {
      turn.errors.push(`POST /api/chat → ${response.status}: ${(await response.text()).slice(0, 200)}`);
      return turn;
    }
    const message = await readAssistantMessage(response, continuation, turn.errors);
    if (!message) return turn;
    recordNewToolCalls(session, message, turn);
    const { message: settled, ran } = await runPendingHostTools(session, message);
    upsertMessage(session, settled);
    onSettled?.(settled);
    turn.text = textOf(settled);
    turn.dataParts = dataPartTypesOf(settled);
    if (turn.errors.length > 0 || hasPendingApproval(settled) || !ran) return turn;
    continuation = settled;
  }
  turn.errors.push(`Stopped after ${MAX_ROUND_TRIPS} round trips`);
  return turn;
}

export function sendUserMessage(session: ChatSession, text: string, onSettled?: (message: UIMessage) => void): Promise<Turn> {
  session.messages.push({ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text }] });
  return runModelTurnRaw(session, false, onSettled);
}
