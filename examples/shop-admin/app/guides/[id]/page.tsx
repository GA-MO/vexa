import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "vexa/ai-elements/code-block";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { ScenarioBadge } from "@/components/scenario-badge";
import { ControlPath, Prose } from "@/components/guides/prose";
import { TryIt } from "@/components/guides/try-it";
import { SCENARIOS, findScenario } from "@/lib/scenarios";
import { controlPathSegments, describeScript, type StepDescription } from "@/lib/scenarios/describe";
import { isGuide } from "@/lib/scenarios/guide-groups";
import { guideRunOf, toolNamesOf } from "@/lib/scenarios/guide-run";
import { describePrompt } from "@/lib/scenarios/action-message";
import { describeMockTurn, mockPrompts, type MockPrompt, type MockStepLine } from "@/lib/scenarios/mock-prompts";
import { readScenarioResult } from "@/lib/scenarios/results";
import { toolSources, type ToolSource } from "@/lib/scenarios/tool-sources";
import type { Scenario, ScenarioResult, StepResult } from "@/lib/scenarios/types";

export const dynamic = "force-dynamic";

const DOCS_BASE_URL = process.env.NEXT_PUBLIC_VEXA_DOCS_URL ?? "http://localhost:3002";
const SHOW_RESULTS = process.env.NODE_ENV === "development";

export function generateStaticParams() {
  return SCENARIOS.filter(isGuide).map((scenario) => ({ id: scenario.id }));
}

function docsUrl(page: string) {
  return `${DOCS_BASE_URL}/docs/${page}`;
}

function WhatHappens({ steps }: { steps: StepDescription[] }) {
  if (steps.length === 0) return <p className="text-sm text-muted-foreground">Nothing scripted: look at the rendered UI.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3 text-sm">
          <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">{index + 1}.</span>
          <div className="flex min-w-0 flex-col gap-1">
            {step.action ? (
              <p className="font-medium text-foreground">
                <Prose text={step.action} />
              </p>
            ) : null}
            {step.outcomes.map((outcome) => (
              <p key={outcome} className="text-muted-foreground">
                <Prose text={outcome} />
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

const MOCK_LINE_STYLES: Record<MockStepLine["kind"], string> = {
  reasoning: "italic text-muted-foreground",
  tool: "font-mono text-xs text-primary",
  text: "text-foreground",
  spec: "font-mono text-xs text-muted-foreground",
  branch: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
};

const MOCK_LINE_LABELS: Partial<Record<MockStepLine["kind"], string>> = {
  reasoning: "thinks",
  tool: "calls",
  text: "says",
  spec: "renders",
};

function MockLine({ line }: { line: MockStepLine }) {
  const label = MOCK_LINE_LABELS[line.kind];
  return (
    <li className="flex gap-2 text-sm" style={{ paddingLeft: `${line.depth * 1.25}rem` }}>
      {label ? <span className="w-12 shrink-0 text-xs text-muted-foreground">{label}</span> : null}
      <span className={MOCK_LINE_STYLES[line.kind]}>{line.text}</span>
    </li>
  );
}

function MockReplies({ prompts }: { prompts: MockPrompt[] }) {
  if (prompts.length === 0) return null;
  return (
    <ul className="flex flex-col divide-y divide-border">
      {prompts.map((entry) => (
        <li key={entry.prompt} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-medium text-foreground">{describePrompt(entry.prompt)}</p>
          <ul className="flex flex-col gap-1">
            {describeMockTurn(entry.turn, entry.prompt).map((line, index) => (
              <MockLine key={index} line={line} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ToolCode({ name, sources }: { name: string; sources: ToolSource[] }) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        <code>{name}</code> has no source in this app (an MCP or fixture-only tool).
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {sources.map((source) => (
        <CodeBlock key={source.file} code={source.code} language="tsx" title={source.file} />
      ))}
    </div>
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

function LastRun({ result }: { result: ScenarioResult | null }) {
  if (!result) return <p className="text-sm text-muted-foreground">Not run yet. Run `bun run test:scenarios` to record a result.</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <ScenarioBadge result={result} />
        <span>{new Date(result.ranAt).toLocaleString("en-GB")}</span>
        {result.model ? <span>with {result.model}</span> : null}
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

function DocsLink({ scenario }: { scenario: Scenario }) {
  if (!scenario.docs) return null;
  return (
    <a href={docsUrl(scenario.docs)} className="text-sm text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
      Docs: {scenario.docs}
    </a>
  );
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = findScenario(id);
  if (!scenario || !isGuide(scenario)) notFound();
  const toolNames = toolNamesOf(scenario);
  const [result, sources] = await Promise.all([
    SHOW_RESULTS ? readScenarioResult(id) : Promise.resolve(null),
    Promise.all(toolNames.map(async (name) => ({ name, sources: await toolSources(name) }))),
  ]);

  return (
    <PageShell
      title={scenario.title}
      description={scenario.bestPractice}
      actions={
        <div className="flex items-center gap-3 text-sm">
          <DocsLink scenario={scenario} />
          <Link href="/guides" className="text-primary underline-offset-2 hover:underline">
            All guides
          </Link>
        </div>
      }
    >
      <ControlPath segments={controlPathSegments(scenario.controlPath)} />
      <Panel title="Try it">
        <TryIt run={guideRunOf(scenario)} />
      </Panel>
      <Panel title="What happens">
        <WhatHappens steps={describeScript(scenario)} />
      </Panel>
      {mockPrompts(scenario).length > 0 ? (
        <Panel title="What the mock model does">
          <MockReplies prompts={mockPrompts(scenario)} />
        </Panel>
      ) : null}
      {sources.length > 0 ? (
        <Panel title="The code">
          <div className="flex flex-col gap-4">
            {sources.map((entry) => (
              <ToolCode key={entry.name} name={entry.name} sources={entry.sources} />
            ))}
          </div>
        </Panel>
      ) : null}
      {SHOW_RESULTS ? (
        <Panel title="Last runner result">
          <LastRun result={result} />
        </Panel>
      ) : null}
    </PageShell>
  );
}
