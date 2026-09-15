import Link from "next/link";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { ScenarioBadge } from "@/components/scenario-badge";
import { SCENARIOS } from "@/lib/scenarios";
import { groupedGuides } from "@/lib/scenarios/guide-groups";
import { mockPrompts } from "@/lib/scenarios/mock-prompts";
import { readScenarioResults } from "@/lib/scenarios/results";
import type { Scenario, ScenarioResultsFile } from "@/lib/scenarios/types";

export const dynamic = "force-dynamic";

const SHOW_RESULTS = process.env.NODE_ENV === "development";

function tryLabel(scenario: Scenario): string {
  if (mockPrompts(scenario).length > 0) return "mock";
  if (scenario.script.length === 0 || !scenario.script.some((step) => "user" in step)) return "live";
  return "real model";
}

function GuideRow({ scenario, results }: { scenario: Scenario; results: ScenarioResultsFile | null }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <Link href={`/guides/${scenario.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
            {scenario.title}
          </Link>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{tryLabel(scenario)}</span>
        </span>
        <span className="text-muted-foreground">{scenario.controlPath}</span>
      </div>
      {SHOW_RESULTS ? <ScenarioBadge result={results?.results[scenario.id] ?? null} /> : null}
    </li>
  );
}

export default async function GuidesIndexPage() {
  const results = SHOW_RESULTS ? await readScenarioResults() : null;
  return (
    <PageShell
      title="Guides"
      description="Every way the chat controls this app, one page each. Open a guide, press its prompts, and watch the page: no API key needed, the mock model plays a fixed script."
    >
      {groupedGuides(SCENARIOS).map((group) => (
        <Panel key={group.title} title={group.title}>
          <ul className="flex flex-col divide-y divide-border">
            {group.scenarios.map((scenario) => (
              <GuideRow key={scenario.id} scenario={scenario} results={results} />
            ))}
          </ul>
        </Panel>
      ))}
    </PageShell>
  );
}
