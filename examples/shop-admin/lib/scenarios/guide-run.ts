import type { Spec } from "vexa/protocol";
import { parseForwardedAction } from "./action-message";
import { openerPrompt } from "./mock-prompts";
import { isApproveStep, isPressStep, isRejectStep, isUserStep, type Scenario, type ScenarioSetup } from "./types";

/** A fixture button whose press forwards a tool call into the chat: the guide points at it instead of showing a prompt button. */
export type ForwardingButton = { label: string; tool: string };

/** The part of a scenario a guide page hands to the browser: plain data, no regexes or functions. */
export type GuideRun = {
  id: string;
  page: string;
  setup: ScenarioSetup | null;
  prompts: string[];
  forwardingButtons: ForwardingButton[];
  manualChecks: string[];
};

function buttonLabel(spec: Spec | undefined, id: string): string {
  const props = spec?.elements[id]?.props as { label?: unknown } | undefined;
  return typeof props?.label === "string" ? props.label : id;
}

function forwardingButtonsOf(scenario: Scenario, spec: Spec | undefined): ForwardingButton[] {
  const forwardedTools = new Set(scenario.script.filter(isUserStep).flatMap((step) => parseForwardedAction(step.user)?.name ?? []));
  if (forwardedTools.size === 0) return [];
  return scenario.script
    .filter(isPressStep)
    .filter((step) => step.deferSend)
    .map((step) => ({ label: buttonLabel(spec, step.press), tool: runToolNamesIn(spec, step.press)[0] ?? [...forwardedTools][0] }));
}

export function guideRunOf(scenario: Scenario): GuideRun {
  const spec = scenario.fixture?.spec ?? scenario.priorAssistantSpec;
  const opener = openerPrompt(scenario);
  const typedPrompts = scenario.script.filter(isUserStep).map((step) => step.user).filter((prompt) => !parseForwardedAction(prompt));
  return {
    id: scenario.id,
    page: scenario.page,
    setup: scenario.setup ?? null,
    prompts: [...(opener ? [opener] : []), ...typedPrompts],
    forwardingButtons: forwardingButtonsOf(scenario, spec),
    manualChecks: scenario.manualChecks ?? [],
  };
}

function runToolNamesIn(spec: Spec | undefined, onlyElementId?: string): string[] {
  if (!spec) return [];
  const names: string[] = [];
  for (const [id, element] of Object.entries(spec.elements)) {
    if (onlyElementId !== undefined && id !== onlyElementId) continue;
    const bindings = [...Object.values(element.on ?? {}), ...Object.values(element.watch ?? {})].flat();
    for (const binding of bindings) {
      const params = binding?.params as { name?: unknown } | undefined;
      if (binding?.action === "runTool" && typeof params?.name === "string") names.push(params.name);
    }
  }
  return names;
}

/** Every tool a scenario touches: model calls it expects, approvals it answers, and runTool targets inside its fixture. */
export function toolNamesOf(scenario: Scenario): string[] {
  const names = new Set<string>();
  for (const step of scenario.script) {
    if (isUserStep(step) || isApproveStep(step) || isRejectStep(step)) for (const name of step.expectTools ?? []) names.add(name);
    if (isApproveStep(step)) names.add(step.approve);
    if (isRejectStep(step)) names.add(step.reject);
  }
  for (const name of runToolNamesIn(scenario.fixture?.spec ?? scenario.priorAssistantSpec)) names.add(name);
  return [...names];
}
