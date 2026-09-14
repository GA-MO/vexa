import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { ScenarioBadge } from "@/components/scenario-badge";
import { SCENARIOS, describeStep, findScenario } from "@/lib/scenarios";
import { readScenarioResult } from "@/lib/scenarios/results";
import type { ScenarioResult, Step, StepResult } from "@/lib/scenarios/types";
import { FixtureFrame } from "./fixture-frame";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SCENARIOS.map((scenario) => ({ id: scenario.id }));
}

function stepExpectations(step: Step): string[] {
  const entries = Object.entries(step).filter(([key]) => key.startsWith("expect"));
  return entries.map(([key, value]) => `${key}: ${value instanceof RegExp ? String(value) : JSON.stringify(value)}`);
}

function ScriptList({ steps }: { steps: Step[] }) {
  if (steps.length === 0) return <p className="text-sm text-muted-foreground">Fixture only, no script.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step, index) => (
        <li key={index} className="flex flex-col gap-0.5 text-sm">
          <span className="font-medium text-foreground">
            {index + 1}. {describeStep(step)}
          </span>
          {stepExpectations(step).map((line) => (
            <code key={line} className="text-xs text-muted-foreground">
              {line}
            </code>
          ))}
        </li>
      ))}
    </ol>
  );
}

function StepRow({ step }: { step: StepResult }) {
  return (
    <li className="flex flex-col gap-1 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold ${step.pass ? "text-success" : "text-danger"}`}>{step.pass ? "pass" : "fail"}</span>
        <span className="font-medium text-foreground">{step.label}</span>
      </div>
      {step.tools.length > 0 ? <span className="text-xs text-muted-foreground">tools: {step.tools.join(", ")}</span> : null}
      {step.text ? <p className="whitespace-pre-wrap text-muted-foreground">{step.text}</p> : null}
      {step.errors.map((error) => (
        <p key={error} className="text-xs text-danger">
          {error}
        </p>
      ))}
    </li>
  );
}

function ManualChecklist({ checks }: { checks: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {checks.map((check) => (
        <li key={check} className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1 size-3.5 shrink-0" disabled />
          <span>{check}</span>
        </li>
      ))}
    </ul>
  );
}

function LastRun({ result }: { result: ScenarioResult | null }) {
  if (!result) return <p className="text-sm text-muted-foreground">Not run yet. Run `bun run test:scenarios` to record a result.</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <ScenarioBadge result={result} />
        <span>{new Date(result.ranAt).toLocaleString("en-GB")}</span>
        {result.note ? <span>({result.note})</span> : null}
      </div>
      {result.steps.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {result.steps.map((step) => (
            <StepRow key={step.index} step={step} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = findScenario(id);
  if (!scenario) notFound();
  const result = await readScenarioResult(id);

  return (
    <PageShell
      title={scenario.title}
      description={scenario.controlPath}
      actions={
        <div className="flex items-center gap-3 text-sm">
          <ScenarioBadge result={result} />
          <Link href="/tests" className="text-primary underline-offset-2 hover:underline">
            All scenarios
          </Link>
        </div>
      }
    >
      <Panel title="Best practice">
        <p className="text-sm text-foreground">{scenario.bestPractice}</p>
        <p className="text-xs text-muted-foreground">
          Page under test:{" "}
          <Link href={scenario.page} className="text-primary underline-offset-2 hover:underline">
            {scenario.page}
          </Link>
        </p>
      </Panel>
      {scenario.fixture ? (
        <Panel title="Fixture">
          <FixtureFrame fixture={scenario.fixture} />
        </Panel>
      ) : null}
      <Panel title="Script">
        <ScriptList steps={scenario.script} />
      </Panel>
      {scenario.manualChecks && scenario.manualChecks.length > 0 ? (
        <Panel title="Manual checks">
          <ManualChecklist checks={scenario.manualChecks} />
        </Panel>
      ) : null}
      <Panel title="Last run">
        <LastRun result={result} />
      </Panel>
    </PageShell>
  );
}
