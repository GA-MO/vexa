import type { Spec } from "vexa/protocol";
import { matchesMockTurn, mockTurnSteps } from "../../../shared/mock-model";
import { parseForwardedAction } from "./action-message";
import { isUserStep, type MockContinuation, type MockStep, type MockTurn, type Scenario, type ScenarioFixture } from "./types";

export type MockPrompt = { prompt: string; turn: MockTurn };

const OPENER_REPLY = "Here it is.";

function fixtureSpec(fixture: ScenarioFixture): Spec {
  if (!fixture.state) return fixture.spec;
  return { ...fixture.spec, state: { ...(fixture.spec.state ?? {}), ...fixture.state } };
}

function hasTypedPrompt(scenario: Scenario): boolean {
  return scenario.script.some((step) => isUserStep(step) && !parseForwardedAction(step.user));
}

/** The prompt that makes the mock render a scenario's fixture inside the chat, so its buttons and inputs are used where a real reply would put them. */
export function openerPrompt(scenario: Scenario): string | null {
  if (scenario.opener) return scenario.opener;
  if (!scenario.fixture || hasTypedPrompt(scenario)) return null;
  return `Show the ${scenario.id} example`;
}

function openerTurn(scenario: Scenario): MockTurn[] {
  const prompt = openerPrompt(scenario);
  const fixture = scenario.fixture ?? (scenario.priorAssistantSpec ? { spec: scenario.priorAssistantSpec } : null);
  if (!prompt || !fixture) return [];
  return [{ match: (text) => text.trim().toLowerCase() === prompt.toLowerCase(), steps: [{ text: OPENER_REPLY }, { spec: fixtureSpec(fixture) }] }];
}

/** A scenario's mock turns: its own scripts first, then the opener that renders its fixture. */
export function mockTurnsOf(scenario: Scenario): MockTurn[] {
  return [...(scenario.mock ?? []), ...openerTurn(scenario)];
}

export { matchesMockTurn, mockTurnSteps };

/** The opener (when the scenario has one) followed by the script prompts the mock model has a reply for. */
export function mockPrompts(scenario: Scenario): MockPrompt[] {
  const turns = mockTurnsOf(scenario);
  const opener = openerPrompt(scenario);
  const prompts = [...(opener ? [opener] : []), ...scenario.script.filter(isUserStep).map((step) => step.user)];
  return prompts.flatMap((prompt) => {
    const turn = turns.find((candidate) => matchesMockTurn(candidate, prompt));
    return turn ? [{ prompt, turn }] : [];
  });
}

/** Prompts a person can type: forwarded button presses are left out because a button, not a keyboard, sends those. */
export function allMockPrompts(scenarios: Scenario[]): string[] {
  return scenarios.flatMap((scenario) => mockPrompts(scenario).map(({ prompt }) => prompt)).filter((prompt) => !parseForwardedAction(prompt));
}

export type MockStepLine = { kind: "reasoning" | "tool" | "text" | "spec" | "branch"; text: string; depth: number };

function continuationLines(label: string, continuation: MockContinuation, depth: number): MockStepLine[] {
  if (typeof continuation === "function") return [{ kind: "branch", text: `${label}: reply built from the tool result`, depth }];
  return [{ kind: "branch", text: label, depth }, ...continuation.flatMap((step) => stepLines(step, depth + 1))];
}

function stepLines(step: MockStep, depth: number): MockStepLine[] {
  if ("reasoning" in step) return [{ kind: "reasoning", text: step.reasoning, depth }];
  if ("text" in step) return [{ kind: "text", text: step.text, depth }];
  if ("spec" in step) return [{ kind: "spec", text: `spec: ${Object.keys(step.spec.elements).length} elements`, depth }];
  if ("patch" in step) return [{ kind: "spec", text: `patch: ${step.patch.map((op) => `${op.op} ${op.path}`).join(", ")}`, depth }];
  return [
    { kind: "tool", text: `${step.tool} ${JSON.stringify(step.input)}`, depth },
    ...continuationLines("then", step.then, depth),
    ...(step.onError ? continuationLines("on error", step.onError, depth) : []),
  ];
}

/** Flattens a mock turn into display lines: what the model thinks, calls, and says, with branches indented. */
export function describeMockTurn(turn: MockTurn, prompt: string): MockStepLine[] {
  return mockTurnSteps(turn, prompt).flatMap((step) => stepLines(step, 0));
}
