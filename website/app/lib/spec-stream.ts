import type { Spec, SpecPatch } from "vexa/protocol";

function encodePointerSegment(segment: string) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function addPatch(path: string, value: unknown): SpecPatch {
  return { op: "add", path, value };
}

/** The JSON Patch operations a model emits, in stream order, to produce this spec. */
export function specStreamPatches(spec: Spec): SpecPatch[] {
  const patches = [addPatch("/root", spec.root)];

  for (const [key, element] of Object.entries(spec.elements)) {
    patches.push(addPatch(`/elements/${encodePointerSegment(key)}`, element));
  }

  for (const [key, value] of Object.entries(spec.state ?? {})) {
    patches.push(addPatch(`/state/${encodePointerSegment(key)}`, value));
  }

  return patches;
}

/** The SpecStream wire text for a spec: one JSON Patch operation per line. */
export function specStreamText(spec: Spec): string {
  return specStreamPatches(spec)
    .map((patch) => JSON.stringify(patch))
    .join("\n");
}
