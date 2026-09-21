import { catalog, normalizeSpec } from "vexa/core";
import type { Spec } from "vexa/protocol";

export type SpecIssue = {
  path: string;
  message: string;
};

export type SpecEvaluation = {
  ok: boolean;
  issues: SpecIssue[];
};

export function evaluateSpec(rawSpec: Spec | null | undefined): SpecEvaluation {
  if (!rawSpec) {
    return { ok: false, issues: [{ path: "/", message: "Spec is empty" }] };
  }

  const spec = normalizeSpec(rawSpec);
  const issues: SpecIssue[] = [];
  const result = catalog.validate(spec);

  if (!result.success && result.error) {
    for (const issue of result.error.issues) {
      issues.push({
        path: `/${issue.path.join("/")}`,
        message: issue.message,
      });
    }
  }

  if (spec.root && !spec.elements?.[spec.root]) {
    issues.push({
      path: "/root",
      message: `Root "${spec.root}" is not in elements`,
    });
  }

  for (const [key, element] of Object.entries(spec.elements ?? {})) {
    if (!catalog.componentNames.includes(element.type)) {
      issues.push({
        path: `/elements/${key}/type`,
        message: `Unknown component type "${element.type}"`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
