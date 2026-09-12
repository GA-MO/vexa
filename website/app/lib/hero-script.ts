import type { Spec, SpecPatch } from "vexa/protocol";
import { COMPOSED_EXAMPLES, type ComposedExample } from "vexa/examples";
import { specStreamPatches } from "@/lib/spec-stream";

export type HeroPhase = "typing" | "thinking" | "prose" | "streaming" | "done";

export type HeroFrame = { index: number; phase: HeroPhase; step: number };

export type HeroScript = {
  id: string;
  title: string;
  prompt: string[];
  prose: string[];
  patches: SpecPatch[];
  spec: Spec;
};

const HERO_EXAMPLE_IDS = ["dashboard", "plan-compare", "order-status", "receipt"];

const PHASE_DELAY_MS: Record<HeroPhase, number> = {
  typing: 42,
  thinking: 700,
  prose: 55,
  streaming: 170,
  done: 4200,
};

const EMPTY_SPEC: Spec = { root: "", elements: {} };

function toScript(example: ComposedExample): HeroScript {
  return {
    id: example.id,
    title: example.title,
    prompt: Array.from(example.prompt),
    prose: example.prose.split(" "),
    patches: specStreamPatches(example.spec),
    spec: example.spec,
  };
}

function scriptsInHeroOrder() {
  const byId = new Map(COMPOSED_EXAMPLES.map((example) => [example.id, example] as const));
  return HERO_EXAMPLE_IDS.map((id) => byId.get(id))
    .filter((example): example is ComposedExample => Boolean(example))
    .map(toScript);
}

export const HERO_SCRIPTS: HeroScript[] = scriptsInHeroOrder();

export function finalFrame(index: number): HeroFrame {
  return { index, phase: "done", step: HERO_SCRIPTS[index].patches.length };
}

export function startFrame(index: number): HeroFrame {
  return { index, phase: "typing", step: 0 };
}

export function nextIndex(index: number) {
  return (index + 1) % HERO_SCRIPTS.length;
}

export function frameDelay(frame: HeroFrame) {
  return PHASE_DELAY_MS[frame.phase];
}

export function advanceFrame(frame: HeroFrame): HeroFrame {
  const script = HERO_SCRIPTS[frame.index];
  const { index, phase, step } = frame;

  if (phase === "typing") {
    if (step < script.prompt.length) return { index, phase, step: step + 1 };
    return { index, phase: "thinking", step: 0 };
  }
  if (phase === "thinking") return { index, phase: "prose", step: 0 };
  if (phase === "prose") {
    if (step < script.prose.length) return { index, phase, step: step + 1 };
    return { index, phase: "streaming", step: 0 };
  }
  if (phase === "streaming") {
    if (step < script.patches.length) return { index, phase, step: step + 1 };
    return finalFrame(index);
  }
  return startFrame(nextIndex(index));
}

function decodePointerSegment(segment: string) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function applyPatch(spec: Spec, patch: SpecPatch): Spec {
  if (patch.op !== "add") return spec;
  const [, bucket, encodedKey] = patch.path.split("/");
  if (bucket === "root") return { ...spec, root: patch.value as string };
  if (!encodedKey) return spec;
  const key = decodePointerSegment(encodedKey);
  if (bucket === "elements") {
    return { ...spec, elements: { ...spec.elements, [key]: patch.value as Spec["elements"][string] } };
  }
  if (bucket === "state") return { ...spec, state: { ...spec.state, [key]: patch.value } };
  return spec;
}

/** The spec a client would hold after the first `count` patches of a script arrived. */
export function specAfterPatches(script: HeroScript, count: number): Spec | null {
  if (count <= 0) return null;
  if (count >= script.patches.length) return script.spec;
  return script.patches.slice(0, count).reduce(applyPatch, EMPTY_SPEC);
}

export function visiblePrompt(script: HeroScript, frame: HeroFrame) {
  if (frame.phase === "typing") return script.prompt.slice(0, frame.step).join("");
  return script.prompt.join("");
}

export function visibleProse(script: HeroScript, frame: HeroFrame) {
  if (frame.phase === "typing" || frame.phase === "thinking") return "";
  if (frame.phase === "prose") return script.prose.slice(0, frame.step).join(" ");
  return script.prose.join(" ");
}

export function visiblePatchCount(frame: HeroFrame) {
  if (frame.phase === "streaming" || frame.phase === "done") return frame.step;
  return 0;
}
