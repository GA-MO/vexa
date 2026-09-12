import { buildSpecFromParts, getTextFromParts } from "@json-render/react";
import type { ComposedExample } from "vexa/examples";
import { SPEC_DATA_PART_TYPE, type Spec, type SpecDataPart, type VexaMessage } from "vexa/protocol";

export type PlaygroundInspection = {
  prompt: string;
  prose: string;
  spec: Spec | null;
  jsonl: string;
};

export const EMPTY_INSPECTION: PlaygroundInspection = { prompt: "", prose: "", spec: null, jsonl: "" };

const EXAMPLE_ID_PREFIX = "playground";
const EXAMPLE_TITLE_LENGTH = 48;
const EXAMPLE_ID_LENGTH = 32;

function latestAssistantIndex(messages: readonly VexaMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "assistant") return index;
  }
  return -1;
}

function promptBefore(messages: readonly VexaMessage[], assistantIndex: number) {
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") return getTextFromParts(messages[index].parts);
  }
  return "";
}

type MessagePart = VexaMessage["parts"][number];
type SpecPart = Extract<MessagePart, { type: typeof SPEC_DATA_PART_TYPE }>;

function isSpecPart(part: MessagePart): part is SpecPart {
  return part.type === SPEC_DATA_PART_TYPE;
}

function specParts(message: VexaMessage): SpecDataPart[] {
  return message.parts.filter(isSpecPart).map((part) => part.data);
}

function streamLine(part: SpecDataPart) {
  if (part.type === "patch") return JSON.stringify(part.patch);
  return JSON.stringify(part);
}

export function inspectMessages(messages: readonly VexaMessage[]): PlaygroundInspection {
  const assistantIndex = latestAssistantIndex(messages);
  if (assistantIndex < 0) return EMPTY_INSPECTION;
  const assistant = messages[assistantIndex];
  return {
    prompt: promptBefore(messages, assistantIndex),
    prose: getTextFromParts(assistant.parts),
    spec: buildSpecFromParts(assistant.parts),
    jsonl: specParts(assistant).map(streamLine).join("\n"),
  };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, EXAMPLE_ID_LENGTH)
    .replace(/-+$/g, "");
}

function truncate(text: string, length: number) {
  const trimmed = text.trim();
  if (trimmed.length <= length) return trimmed;
  return `${trimmed.slice(0, length - 1).trimEnd()}…`;
}

export function exampleSource(inspection: PlaygroundInspection, spec: Spec, today: string): string {
  const slug = slugify(inspection.prompt) || "example";
  const example: ComposedExample = {
    id: `${EXAMPLE_ID_PREFIX}-${slug}`,
    title: truncate(inspection.prompt, EXAMPLE_TITLE_LENGTH) || "Playground example",
    note: `Captured from the playground on ${today}.`,
    prompt: inspection.prompt,
    prose: inspection.prose,
    spec,
  };
  return JSON.stringify(example, null, 2);
}

export function stateSource(spec: Spec | null) {
  if (!spec) return "";
  return JSON.stringify(spec.state ?? {}, null, 2);
}
