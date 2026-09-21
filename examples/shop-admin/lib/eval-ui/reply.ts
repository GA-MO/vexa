import { applySpecPatch, type JsonPatch } from "@json-render/core";
import type { UIMessage } from "ai";
import { normalizeSpec } from "vexa/core";
import type { Spec, SpecPatch } from "vexa/protocol";

const PROP_PREVIEW = 40;
const EMPTY_SPEC = (): Spec => ({ root: "", elements: {} });

type SpecPayload = { type: "patch"; patch: SpecPatch } | { type: "flat"; spec: Spec } | { type: "nested"; spec: unknown };

function specPayloads(message: UIMessage | undefined): SpecPayload[] {
  return (message?.parts ?? [])
    .filter((part) => part.type === "data-spec")
    .map((part) => (part as { data?: SpecPayload }).data)
    .filter((data): data is SpecPayload => typeof data === "object" && data !== null && "type" in data);
}

/** The spec an assistant message renders: every data-spec part merged, or null when the reply had no UI. */
export function specOf(message: UIMessage | undefined): Spec | null {
  const payloads = specPayloads(message);
  if (payloads.length === 0) return null;
  const spec = EMPTY_SPEC();
  for (const payload of payloads) {
    if (payload.type === "patch") applySpecPatch(spec, payload.patch as JsonPatch);
    else if (payload.type === "flat") Object.assign(spec, payload.spec);
  }
  return spec.root && Object.keys(spec.elements).length > 0 ? normalizeSpec(spec) : null;
}

/** The distinct component types in a spec, in first-seen order. */
export function componentsOf(spec: Spec | null): string[] {
  if (!spec) return [];
  return [...new Set(Object.values(spec.elements).map((element) => element.type))];
}

function preview(value: unknown): string {
  if (typeof value === "string") return `"${value.length > PROP_PREVIEW ? `${value.slice(0, PROP_PREVIEW)}…` : value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  return "";
}

function propsSummary(props: Record<string, unknown> | undefined): string {
  if (!props) return "";
  return Object.entries(props)
    .map(([key, value]) => [key, preview(value)] as const)
    .filter(([, text]) => text !== "")
    .slice(0, 4)
    .map(([key, text]) => `${key}: ${text}`)
    .join("; ");
}

function renderTree(spec: Spec, id: string, depth: number, seen: Set<string>): string[] {
  const element = spec.elements[id];
  if (!element || seen.has(id)) return [`${"  ".repeat(depth)}${id} (missing)`];
  seen.add(id);
  const line = `${"  ".repeat(depth)}${element.type}(${propsSummary(element.props as Record<string, unknown> | undefined)})`;
  const children = (element.children ?? []).flatMap((child) => renderTree(spec, child, depth + 1, seen));
  return [line, ...children];
}

/** The spec as an indented type(props) outline, for logs and reports. */
export function specTree(spec: Spec | null): string {
  if (!spec) return "(no spec)";
  return renderTree(spec, spec.root, 0, new Set()).join("\n");
}
