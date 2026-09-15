import type { Spec, SpecPatch } from "vexa/protocol";
import type { HostToolDescriptor, HostToolResult } from "vexa/react";
import type { ShopFilters } from "@/lib/shop/data";

export type ModelExpectations = {
  expectTools?: string[];
  expectToolsInOrder?: boolean;
  expectNoTools?: boolean;
  expectText?: RegExp | string;
  expectDataParts?: string[];
  expectToolInput?: Record<string, Record<string, unknown>>;
};

export type UserStep = { user: string } & ModelExpectations;

export type PressStep = {
  press: string;
  item?: string;
  expectState?: Record<string, unknown>;
  expectToast?: string;
  expectNoModelTurn?: boolean;
  deferSend?: boolean;
};

export type TypeStep = { type: { path: string; value: unknown } };

export type ApproveStep = { approve: string } & ModelExpectations;

export type RejectStep = { reject: string } & ModelExpectations;

export type ExpectStateStep = { expectState: Record<string, unknown> };

export type ExpectSentToChatStep = { expectSentToChat: string | RegExp };

export type RequestStep = {
  request: { method: "GET" | "POST"; path: string; body?: unknown; headers?: Record<string, string> };
  expectStatus: number;
  expectBody?: RegExp;
};

export type PatchStep = { patch: SpecPatch[] };

export type ExpectSpecStep = { expectSpec: Record<string, { exists?: boolean }> };

export type Step =
  | UserStep
  | PressStep
  | TypeStep
  | ApproveStep
  | RejectStep
  | ExpectStateStep
  | ExpectSentToChatStep
  | RequestStep
  | PatchStep
  | ExpectSpecStep;

export type ScenarioFixture = {
  spec: Spec;
  state?: Record<string, unknown>;
};

export type HeadlessToolFn = (input: Record<string, unknown>) => HostToolResult | Promise<HostToolResult>;

export type HeadlessTool = HeadlessToolFn | { confirm: true; run: HeadlessToolFn };

export type MockContinuation = MockStep[] | ((output: unknown) => MockStep[]);

export type MockToolStep = { tool: string; input: Record<string, unknown>; then: MockContinuation; onError?: MockContinuation };

export type MockStep = { reasoning: string } | { text: string } | { spec: Spec } | { patch: SpecPatch[] } | MockToolStep;

/** One scripted reply of the mock model: `match` runs against the last user message, `steps` may derive from it, a `tool` step must close its array and continue through `then` / `onError`. */
export type MockTurn = {
  match: RegExp | ((prompt: string) => boolean);
  steps: MockStep[] | ((prompt: string) => MockStep[]);
};

export type ScenarioKind = "guide" | "check";

/** Page state a guide applies before the first prompt, so the chat sees what the scenario assumes. */
export type ScenarioSetup = { selectedOrderId?: string | null; filters?: Partial<ShopFilters> };

export type Scenario = {
  id: string;
  title: string;
  controlPath: string;
  page: string;
  kind?: ScenarioKind;
  docs?: string;
  setup?: ScenarioSetup;
  opener?: string;
  fixture?: ScenarioFixture;
  script: Step[];
  mock?: MockTurn[];
  bestPractice: string;
  hostTools?: HostToolDescriptor[];
  tools?: Record<string, HeadlessTool>;
  context?: Record<string, unknown>;
  priorAssistantSpec?: Spec;
  manualChecks?: string[];
  requiresEnv?: string;
  attempts?: number;
};

export type StateDiff = Record<string, { expected: unknown; actual: unknown }>;

export type StepResult = {
  index: number;
  label: string;
  pass: boolean;
  tools: string[];
  text: string;
  stateDiff: StateDiff;
  errors: string[];
};

export type ScenarioResult = {
  id: string;
  pass: boolean;
  ranAt: string;
  model?: string;
  note?: string;
  steps: StepResult[];
};

export type ScenarioResultsFile = {
  ranAt: string;
  results: Record<string, ScenarioResult>;
};

export function isUserStep(step: Step): step is UserStep {
  return "user" in step;
}

export function isPressStep(step: Step): step is PressStep {
  return "press" in step;
}

export function isTypeStep(step: Step): step is TypeStep {
  return "type" in step;
}

export function isApproveStep(step: Step): step is ApproveStep {
  return "approve" in step;
}

export function isRejectStep(step: Step): step is RejectStep {
  return "reject" in step;
}

export function isExpectSentToChatStep(step: Step): step is ExpectSentToChatStep {
  return "expectSentToChat" in step;
}

export function isRequestStep(step: Step): step is RequestStep {
  return "request" in step;
}

export function isPatchStep(step: Step): step is PatchStep {
  return "patch" in step;
}

export function isExpectSpecStep(step: Step): step is ExpectSpecStep {
  return "expectSpec" in step;
}

export function describeStep(step: Step): string {
  if (isUserStep(step)) return `user: ${step.user}`;
  if (isPressStep(step)) return `press: ${step.press}${step.item ? ` (item: ${step.item})` : ""}`;
  if (isTypeStep(step)) return `type: ${step.type.path} = ${JSON.stringify(step.type.value)}`;
  if (isApproveStep(step)) return `approve: ${step.approve}`;
  if (isRejectStep(step)) return `reject: ${step.reject}`;
  if (isExpectSentToChatStep(step)) return `expectSentToChat: ${String(step.expectSentToChat)}`;
  if (isRequestStep(step)) return `request: ${step.request.method} ${step.request.path}`;
  if (isPatchStep(step)) return `patch: ${step.patch.map((op) => `${op.op} ${op.path}`).join(", ")}`;
  if (isExpectSpecStep(step)) return `expectSpec: ${Object.keys(step.expectSpec).join(", ")}`;
  return `expectState: ${Object.keys(step.expectState).join(", ")}`;
}
