import type { Spec } from "vexa/protocol";
import { parseForwardedAction } from "./action-message";
import {
  isApproveStep,
  isExpectSentToChatStep,
  isExpectSpecStep,
  isPatchStep,
  isPressStep,
  isPageClickStep,
  isPageNavigateStep,
  isRejectStep,
  isRequestStep,
  isTypeStep,
  isUserStep,
  type ModelExpectations,
  type PageExpectation,
  type Scenario,
  type Step,
} from "./types";

/** One script step as prose: `action` is what the reader does, `outcomes` what the scenario expects. Backticks mark code. */
export type StepDescription = { action: string | null; outcomes: string[] };

function code(value: unknown): string {
  return `\`${typeof value === "string" ? value : JSON.stringify(value)}\``;
}

function quote(text: string): string {
  return `“${text}”`;
}

function list(names: string[]): string {
  return names.map(code).join(", ");
}

function elementLabel(spec: Spec | undefined, id: string): string {
  const props = spec?.elements[id]?.props as { label?: unknown } | undefined;
  return typeof props?.label === "string" ? quote(props.label) : code(id);
}

function fieldLabel(spec: Spec | undefined, path: string): string {
  if (!spec) return code(path);
  const bound = Object.values(spec.elements).find((element) => {
    const props = element.props as { value?: unknown; checked?: unknown } | undefined;
    const binding = (props?.value ?? props?.checked) as { $bindState?: string } | undefined;
    return binding?.$bindState === path;
  });
  const props = bound?.props as { label?: unknown } | undefined;
  return typeof props?.label === "string" ? `${quote(props.label)} (${code(path)})` : code(path);
}

function textExpectation(expected: RegExp | string): string {
  if (typeof expected === "string") return `The reply includes ${quote(expected)}.`;
  if (expected.source === ".") return "The model replies with text.";
  return `The reply matches ${code(String(expected))}.`;
}

function pageOutcomes(page: PageExpectation | undefined): string[] {
  if (!page) return [];
  const outcomes: string[] = [];
  if (page.path) outcomes.push(`The app is still on ${code(page.path)}; the assistant did not navigate.`);
  if (page.dialogOpen === true) outcomes.push("The app's own confirmation dialog is open; nothing is committed yet.");
  if (page.dialogOpen === false) outcomes.push("No dialog is open.");
  if (page.textPresent) outcomes.push(`The page shows ${quote(page.textPresent)}.`);
  if (page.textAbsent) outcomes.push(`The page no longer shows ${quote(page.textAbsent)}.`);
  return outcomes;
}

function modelOutcomes(step: ModelExpectations): string[] {
  const outcomes: string[] = [...pageOutcomes(step.expectPage)];
  if (step.expectNoTools) outcomes.push("The model answers without calling a tool.");
  if (step.expectToolsAnyOf) {
    outcomes.push(`The model calls ${step.expectToolsAnyOf.map((set) => list(set)).join(", or ")}.`);
  }
  if (step.expectTools) {
    const order = step.expectToolsInOrder && step.expectTools.length > 1 ? " in that order" : "";
    outcomes.push(`The model calls ${list(step.expectTools)}${order}.`);
  }
  if (step.expectToolsInclude) outcomes.push(`The model calls ${list(step.expectToolsInclude)} at least once.`);
  if (step.expectStore) outcomes.push(`Afterwards ${step.expectStore.label}.`);
  if (step.expectToolInput) {
    for (const [name, input] of Object.entries(step.expectToolInput)) outcomes.push(`${code(name)} receives ${code(input)}.`);
  }
  if (step.expectText) outcomes.push(textExpectation(step.expectText));
  if (step.expectDataParts) outcomes.push(`The stream carries ${list(step.expectDataParts)}.`);
  return outcomes;
}

function stateOutcomes(expected: Record<string, unknown> | undefined): string[] {
  if (!expected) return [];
  return Object.entries(expected).map(([path, value]) => `${code(path)} becomes ${code(value)}.`);
}

function describePress(step: Extract<Step, { press: string }>, spec: Spec | undefined): StepDescription {
  const target = step.item ? `${elementLabel(spec, step.press)} on the ${code(step.item)} row` : elementLabel(spec, step.press);
  const outcomes = stateOutcomes(step.expectState);
  if (step.expectToast !== undefined) outcomes.push(`A toast says ${quote(step.expectToast)}.`);
  if (step.expectNoModelTurn) outcomes.push("No model turn happens.");
  if (step.deferSend) outcomes.push("The press forwards a message to the chat; the next step sends it.");
  return { action: `Press ${target}.`, outcomes };
}

function describeRequest(step: Extract<Step, { request: unknown }>): StepDescription {
  const outcomes = [`The server answers ${code(step.expectStatus)}.`];
  if (step.expectBody) outcomes.push(`The body matches ${code(String(step.expectBody))}.`);
  return { action: `Send ${code(`${step.request.method} ${step.request.path}`)} with ${code(step.request.body ?? {})}.`, outcomes };
}

function describeUserStep(step: Extract<Step, { user: string }>): StepDescription {
  const forwarded = parseForwardedAction(step.user);
  const action = forwarded
    ? `The chat receives the forwarded ${code(forwarded.name)} request with ${code(forwarded.input)}.`
    : `Type ${quote(step.user)}.`;
  return { action, outcomes: modelOutcomes(step) };
}

export function describeScriptStep(step: Step, spec: Spec | undefined): StepDescription {
  if (isUserStep(step)) return describeUserStep(step);
  if (isPressStep(step)) return describePress(step, spec);
  if (isTypeStep(step)) return { action: `Set ${fieldLabel(spec, step.type.path)} to ${code(step.type.value)}.`, outcomes: [] };
  if (isApproveStep(step)) return { action: `Approve the ${code(step.approve)} prompt.`, outcomes: modelOutcomes(step) };
  if (isRejectStep(step)) return { action: `Reject the ${code(step.reject)} prompt.`, outcomes: modelOutcomes(step) };
  if (isPageClickStep(step)) return { action: `Press ${code(step.pageClick)} in the app's own dialog.`, outcomes: pageOutcomes(step.expectPage) };
  if (isPageNavigateStep(step)) return { action: `Open ${code(step.pageNavigate)} yourself, as if clicking its nav link.`, outcomes: pageOutcomes(step.expectPage) };
  if (isExpectSentToChatStep(step)) return { action: null, outcomes: [`The chat receives a message matching ${code(String(step.expectSentToChat))}.`] };
  if (isRequestStep(step)) return describeRequest(step);
  if (isPatchStep(step)) return { action: `The spec is patched: ${step.patch.map((op) => code(`${op.op} ${op.path}`)).join(", ")}.`, outcomes: [] };
  if (isExpectSpecStep(step)) {
    return {
      action: null,
      outcomes: Object.entries(step.expectSpec).map(([id, { exists }]) => `Element ${code(id)} ${exists ? "exists" : "is gone"}.`),
    };
  }
  return { action: null, outcomes: stateOutcomes(step.expectState) };
}

export function describeScript(scenario: Scenario): StepDescription[] {
  const spec = scenario.fixture?.spec ?? scenario.priorAssistantSpec;
  return scenario.script.map((step) => describeScriptStep(step, spec));
}

export function controlPathSegments(controlPath: string): string[] {
  return controlPath
    .split("→")
    .map((segment) => segment.trim())
    .filter(Boolean);
}
