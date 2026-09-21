"use client";

import { SpecView } from "vexa/react";
import { EVAL_UI_SPECS, type EvalUiSpec } from "@/lib/eval-ui/specs";

const PANEL_WIDTH = 340;

function EvalCard({ entry }: { entry: EvalUiSpec }) {
  return (
    <section className="flex shrink-0 flex-col gap-2" style={{ width: PANEL_WIDTH }}>
      <h2 className="text-sm font-medium text-foreground">{entry.prompt}</h2>
      <p className="text-xs text-muted-foreground">
        {entry.id} · {entry.kind}
      </p>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        {entry.text ? <p className="text-sm text-foreground">{entry.text}</p> : null}
        {entry.spec ? <SpecView spec={entry.spec} showDevtools={false} /> : <p className="text-xs text-muted-foreground">No UI in this reply.</p>}
      </div>
    </section>
  );
}

export default function EvalUiTestPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Generative UI eval</h1>
          <p className="text-sm text-muted-foreground">
            The reply the real model gave to each eval prompt with admin on, rendered at {PANEL_WIDTH}px. Regenerate with <code>bun run eval:ui</code>.
          </p>
        </header>
        {EVAL_UI_SPECS.length === 0 ? (
          <p className="text-sm text-muted-foreground">No eval run yet.</p>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            {EVAL_UI_SPECS.map((entry) => (
              <EvalCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
