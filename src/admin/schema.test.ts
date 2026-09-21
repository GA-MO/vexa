import { describe, expect, test } from "bun:test";
import { describePlanIssue, planJsonSchema, planSchema } from "./schema";

function walk(value: unknown, visit: (key: string) => void) {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, visit));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    visit(key);
    walk(item, visit);
  }
}

describe("plan JSON schema", () => {
  test("has no $ref, $defs or oneOf so small models can follow it", () => {
    const keys = new Set<string>();
    walk(planJsonSchema, (key) => keys.add(key));
    expect(keys.has("$ref")).toBe(false);
    expect(keys.has("$defs")).toBe(false);
    expect(keys.has("oneOf")).toBe(false);
  });

  test("tells the model that steps are objects", () => {
    expect(JSON.stringify(planJsonSchema)).toContain("never strings");
  });
});

describe("planSchema", () => {
  test("turns flat steps into the step union", () => {
    const plan = planSchema.parse({
      steps: [
        { action: "navigate", to: "/orders" },
        { action: "fill", target: "i9", value: "Berlin" },
        { action: "check", target: { role: "checkbox", name: "Gift" }, checked: true },
        { action: "wait", for: "idle" },
      ],
    });
    expect(plan.steps).toEqual([
      { action: "navigate", to: "/orders" },
      { action: "fill", target: "i9", value: "Berlin" },
      { action: "check", target: { role: "checkbox", name: "Gift" }, checked: true },
      { action: "wait", for: "idle" },
    ]);
  });

  test("a string step fails at steps.0 with an object example", () => {
    const input = { steps: ["click b4"] };
    const parsed = planSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0].path.join(".")).toBe("steps.0");
    expect(describePlanIssue(input, parsed.error.issues[0])).toBe('steps.0: must be an object like {"action":"click","target":"b4"}, not a string');
  });

  test("a step missing the field its action needs names the step and field", () => {
    const input = { steps: [{ action: "click", target: "b1" }, { action: "fill", target: "i2" }] };
    const parsed = planSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(describePlanIssue(input, parsed.error.issues[0])).toBe("steps.1.value: fill needs target and value");
  });

  test("within accepts a ref or a one-level target", () => {
    const byRef = planSchema.safeParse({ steps: [{ action: "click", target: { role: "button", name: "Edit", within: "t1" } }] });
    const byRow = planSchema.safeParse({ steps: [{ action: "click", target: { role: "button", name: "Edit", within: { role: "row", name: "/C-1042/" } } }] });
    const nested = planSchema.safeParse({
      steps: [{ action: "click", target: { role: "button", name: "Edit", within: { role: "row", name: "x", within: "t1" } } }],
    });
    expect(byRef.success).toBe(true);
    expect(byRow.success).toBe(true);
    expect(nested.success).toBe(false);
  });
});
