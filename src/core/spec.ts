import type { Spec } from "../protocol";

type ElementRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ElementRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeElement(element: unknown): unknown {
  if (!isRecord(element)) return element;
  const filled: ElementRecord = { ...element };
  if (!isRecord(filled.props)) filled.props = {};
  if (!Array.isArray(filled.children)) filled.children = [];
  return filled;
}

/** Fills the keys the catalog schema requires on every element (`props` → `{}`, `children` → `[]`) when a model left them out; nothing else changes. */
export function normalizeSpec<T extends Spec | null | undefined>(spec: T): T {
  if (!spec || !isRecord(spec.elements)) return spec;
  const elements = Object.fromEntries(Object.entries(spec.elements).map(([key, element]) => [key, normalizeElement(element)]));
  return { ...spec, elements } as T;
}
