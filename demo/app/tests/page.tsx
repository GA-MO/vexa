import Link from "next/link";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { ScenarioBadge } from "@/components/scenario-badge";
import { SCENARIOS } from "@/lib/scenarios";
import { readScenarioResults } from "@/lib/scenarios/results";

export const dynamic = "force-dynamic";

export default async function TestsIndexPage() {
  const file = await readScenarioResults();
  const lastRun = file?.ranAt ? new Date(file.ranAt).toLocaleString("en-GB") : "never";
  return (
    <PageShell title="Tests" description={`One page per control path. Last run: ${lastRun}. Run with bun run test:scenarios [id].`}>
      <Panel>
        <ul className="flex flex-col divide-y divide-border">
          {SCENARIOS.map((scenario) => (
            <li key={scenario.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
              <div className="flex min-w-0 flex-col gap-0.5">
                <Link href={`/tests/${scenario.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                  {scenario.title}
                </Link>
                <span className="text-muted-foreground">{scenario.controlPath}</span>
              </div>
              <ScenarioBadge result={file?.results[scenario.id] ?? null} />
            </li>
          ))}
        </ul>
      </Panel>
    </PageShell>
  );
}
