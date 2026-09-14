"use client";

import { SpecView } from "vexa/react";
import type { ScenarioFixture } from "@/lib/scenarios/types";

const FRAME_WIDTH = 340;

export function FixtureFrame({ fixture }: { fixture: ScenarioFixture }) {
  const spec = fixture.state ? { ...fixture.spec, state: { ...(fixture.spec.state ?? {}), ...fixture.state } } : fixture.spec;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{FRAME_WIDTH}px frame, rendered with SpecView and no model</p>
      <div className="rounded-2xl border border-border bg-background p-3" style={{ width: FRAME_WIDTH }}>
        <SpecView spec={spec} showDevtools={false} />
      </div>
    </div>
  );
}
