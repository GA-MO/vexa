import type { ScenarioResult } from "@/lib/scenarios/types";

const BADGE_STYLES = {
  pass: "bg-success/10 text-success",
  fail: "bg-danger/10 text-danger",
  none: "bg-muted text-muted-foreground",
} as const;

function badgeKind(result: ScenarioResult | null): keyof typeof BADGE_STYLES {
  if (!result) return "none";
  return result.pass ? "pass" : "fail";
}

const BADGE_LABELS = { pass: "pass", fail: "fail", none: "not run yet" } as const;

export function ScenarioBadge({ result }: { result: ScenarioResult | null }) {
  const kind = badgeKind(result);
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[kind]}`}>
      {BADGE_LABELS[kind]}
    </span>
  );
}
