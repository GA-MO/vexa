import { SPEC_DATA_PART_TYPE, type VexaMessage } from "vexa/protocol";

type MessagePart = VexaMessage["parts"][number];

const ROOT_PATH = "/root";

function isSpecPart(part: MessagePart): boolean {
  return part.type === SPEC_DATA_PART_TYPE;
}

function specPayload(part: MessagePart): { type?: string; patch?: { path?: string } } | null {
  const data = (part as { data?: unknown }).data;
  return typeof data === "object" && data !== null ? (data as { type?: string; patch?: { path?: string } }) : null;
}

function startsRoot(part: MessagePart): boolean {
  const payload = specPayload(part);
  if (!payload) return false;
  if (payload.type === "flat" || payload.type === "nested") return true;
  return payload.type === "patch" && payload.patch?.path === ROOT_PATH;
}

function specParts(message: VexaMessage): MessagePart[] {
  return message.parts.filter(isSpecPart);
}

/** A reply that only patches (no new root) continues the UI of the previous reply that had one. */
function isContinuation(message: VexaMessage): boolean {
  const parts = specParts(message);
  return message.role === "assistant" && parts.length > 0 && !parts.some(startsRoot);
}

function ownsRoot(message: VexaMessage): boolean {
  return message.role === "assistant" && specParts(message).some(startsRoot);
}

/** The spec parts a message renders: its own, plus every later patch-only reply until a reply starts a new root. A continuation renders none itself. */
export function specPartsFor(message: VexaMessage, messages: VexaMessage[] | undefined): MessagePart[] {
  if (!messages) return specParts(message);
  const index = messages.findIndex((candidate) => candidate.id === message.id);
  if (index === -1) return specParts(message);
  if (isContinuation(message) && messages.slice(0, index).some(ownsRoot)) return [];
  if (!ownsRoot(message)) return specParts(message);
  const carried: MessagePart[] = [];
  for (const later of messages.slice(index + 1)) {
    if (later.role !== "assistant") continue;
    if (ownsRoot(later)) break;
    carried.push(...specParts(later));
  }
  return [...specParts(message), ...carried];
}
