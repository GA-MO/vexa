import { z } from "zod";

export const PLAN_STEP_LIMIT = 20;

const NAME_LIMIT = 200;
const REF_LIMIT = 12;
const VALUE_LIMIT = 2000;

export const STEP_ACTIONS = ["navigate", "click", "fill", "select", "check", "submit", "read", "wait"] as const;

export type StepAction = (typeof STEP_ACTIONS)[number];

const REQUIRED_FIELDS: Record<StepAction, ReadonlyArray<keyof StepInput>> = {
  navigate: ["to"],
  click: ["target"],
  fill: ["target", "value"],
  select: ["target", "value"],
  check: ["target", "checked"],
  submit: ["target"],
  read: ["target"],
  wait: ["for"],
};

const STEP_EXAMPLE = '{"action":"click","target":"b4"}';

const refSchema = z.string().min(1).max(REF_LIMIT).describe("A ref from the latest snapshot, e.g. b3");

const roleSchema = z.string().min(1).max(40).describe("ARIA role, e.g. button, link, textbox, combobox, row");
const nameSchema = z.string().min(1).max(NAME_LIMIT).describe("Accessible name; /regex/ allowed");
const nthSchema = z.number().int().min(0).optional().describe("Pick one when several match");

const scopeSchema = z.union([refSchema, z.object({ role: roleSchema, name: nameSchema, nth: nthSchema }).strict()]);

export const targetSchema = z.union([
  refSchema,
  z
    .object({
      role: roleSchema,
      name: nameSchema,
      within: scopeSchema.optional().describe("Scope: a ref or a row/group/table target"),
      nth: nthSchema,
    })
    .strict(),
]);

export type TargetScope = z.infer<typeof scopeSchema>;

export type TargetQuery = { role: string; name: string; within?: TargetScope; nth?: number };

export type Target = string | TargetQuery;

const stepInputSchema = z
  .object({
    action: z.enum(STEP_ACTIONS),
    target: targetSchema.optional().describe("For click, fill, select, check, submit, read"),
    value: z.string().max(VALUE_LIMIT).optional().describe("For fill (text) and select (option label or value)"),
    to: z.string().min(1).max(NAME_LIMIT).optional().describe("For navigate: a path like /orders or a link name"),
    checked: z.boolean().optional().describe("For check"),
    for: z.enum(["navigation", "idle"]).optional().describe("For wait"),
  })
  .strict();

export type StepInput = z.infer<typeof stepInputSchema>;

/** The flat shape the model fills in; every step is one object with `action` plus the fields that action needs. */
export const planInputSchema = z
  .object({
    steps: z
      .array(stepInputSchema)
      .min(1)
      .max(PLAN_STEP_LIMIT)
      .describe(`Objects like {"action":"fill","target":"i9","value":"Berlin"}; never strings`),
  })
  .strict();

export type Step =
  | { action: "navigate"; to: string }
  | { action: "click"; target: Target }
  | { action: "fill"; target: Target; value: string }
  | { action: "select"; target: Target; value: string }
  | { action: "check"; target: Target; checked: boolean }
  | { action: "submit"; target: Target }
  | { action: "read"; target: Target }
  | { action: "wait"; for: "navigation" | "idle" };

export type Plan = { steps: Step[] };

function missingFields(step: StepInput): Array<keyof StepInput> {
  return REQUIRED_FIELDS[step.action].filter((field) => step[field] === undefined);
}

function requireFieldsPerAction(plan: z.infer<typeof planInputSchema>, ctx: z.RefinementCtx) {
  plan.steps.forEach((step, index) => {
    const missing = missingFields(step);
    if (missing.length === 0) return;
    ctx.addIssue({ code: "custom", path: ["steps", index, missing[0]], message: `${step.action} needs ${REQUIRED_FIELDS[step.action].join(" and ")}` });
  });
}

function toStep(step: StepInput): Step {
  switch (step.action) {
    case "navigate":
      return { action: "navigate", to: step.to as string };
    case "fill":
    case "select":
      return { action: step.action, target: step.target as Target, value: step.value as string };
    case "check":
      return { action: "check", target: step.target as Target, checked: step.checked as boolean };
    case "wait":
      return { action: "wait", for: step.for as "navigation" | "idle" };
    default:
      return { action: step.action, target: step.target as Target };
  }
}

function toPlan(plan: z.infer<typeof planInputSchema>): Plan {
  return { steps: plan.steps.map(toStep) };
}

export const planSchema = planInputSchema.superRefine(requireFieldsPerAction).transform(toPlan);

export const planJsonSchema = z.toJSONSchema(planInputSchema) as Record<string, unknown>;

export function describePlanIssue(input: unknown, issue: z.core.$ZodIssue): string {
  const path = issue.path.join(".");
  const step = stepAt(input, issue.path);
  if (typeof step === "string") return `${path}: must be an object like ${STEP_EXAMPLE}, not a string`;
  return path ? `${path}: ${issue.message}` : issue.message;
}

function stepAt(input: unknown, path: PropertyKey[]): unknown {
  if (path[0] !== "steps" || typeof path[1] !== "number") return undefined;
  const steps = (input as { steps?: unknown })?.steps;
  return Array.isArray(steps) ? steps[path[1]] : undefined;
}
