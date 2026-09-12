import { ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SpecView } from "vexa/react";
import {
  advanceFrame,
  finalFrame,
  frameDelay,
  HERO_SCRIPTS,
  nextIndex,
  specAfterPatches,
  startFrame,
  visiblePatchCount,
  visibleProse,
  visiblePrompt,
  type HeroFrame,
  type HeroScript,
} from "@/lib/hero-script";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TICKER_MAX_CHARS = 96;
const ASSISTANT_NAME = "Acme assistant";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return visible;
}

function useHeroPlayback(reduced: boolean, paused: boolean) {
  const [frame, setFrame] = useState<HeroFrame>(() => finalFrame(0));
  const pageVisible = usePageVisible();
  const running = !reduced && !paused && pageVisible;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setFrame(advanceFrame), frameDelay(frame));
    return () => window.clearTimeout(timer);
  }, [frame, running]);

  const play = (index: number) => setFrame(reduced ? finalFrame(index) : startFrame(index));

  return { frame, play };
}

function Caret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-hero-blink bg-current"
    />
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Thinking">
      {[0, 1, 2].map((slot) => (
        <span
          key={slot}
          className="size-1.5 animate-hero-pulse rounded-full bg-muted-foreground"
          style={{ animationDelay: `${slot * 160}ms` }}
        />
      ))}
    </span>
  );
}

function FrameHeader({ script, phase }: { script: HeroScript; phase: HeroFrame["phase"] }) {
  const live = phase === "streaming" || phase === "prose" || phase === "thinking";
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-brand-violet text-primary-foreground">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <span className="truncate text-sm font-medium text-foreground">{ASSISTANT_NAME}</span>
      </div>
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <span
          className={`size-1.5 rounded-full ${live ? "animate-hero-pulse bg-success" : "bg-muted-foreground/50"}`}
        />
        {live ? "Streaming" : script.title}
      </span>
    </div>
  );
}

function UserBubble({ text, typing }: { text: string; typing: boolean }) {
  return (
    <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-md shadow-primary/25">
      {text}
      {typing ? <Caret /> : null}
    </p>
  );
}

function AssistantTurn({ script, frame }: { script: HeroScript; frame: HeroFrame }) {
  const prose = visibleProse(script, frame);
  const spec = specAfterPatches(script, visiblePatchCount(frame));

  if (frame.phase === "typing") return null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {frame.phase === "thinking" ? <ThinkingDots /> : null}
      {prose ? (
        <p className="text-sm leading-relaxed text-foreground">
          {prose}
          {frame.phase === "prose" ? <Caret /> : null}
        </p>
      ) : null}
      {spec ? (
        <div key={script.id} className="w-full min-w-0 animate-hero-rise">
          <SpecView showDevtools={false} spec={spec} loading={frame.phase !== "done"} />
        </div>
      ) : null}
    </div>
  );
}

function tickerLine(script: HeroScript, frame: HeroFrame) {
  const count = visiblePatchCount(frame);
  if (count === 0) return "spec stream · waiting for the first patch";
  const line = JSON.stringify(script.patches[count - 1]);
  return line.length > TICKER_MAX_CHARS ? `${line.slice(0, TICKER_MAX_CHARS)}…` : line;
}

function PatchTicker({ script, frame }: { script: HeroScript; frame: HeroFrame }) {
  const count = visiblePatchCount(frame);
  return (
    <div className="flex items-center gap-3 border-t border-border bg-muted/60 px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
        {tickerLine(script, frame)}
      </code>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
        {count}/{script.patches.length}
      </span>
    </div>
  );
}

function ScriptPicker({
  activeIndex,
  onPick,
}: {
  activeIndex: number;
  onPick: (index: number) => void;
}) {
  const script = HERO_SCRIPTS[activeIndex];
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 truncate text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{script.title}</span>
        <span className="tabular-nums"> · {activeIndex + 1}/{HERO_SCRIPTS.length}</span>
      </p>
      <button
        type="button"
        onClick={() => onPick(nextIndex(activeIndex))}
        className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:border-primary/50 hover:text-primary"
      >
        Next example
        <ChevronRight className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

function useAutoScroll(frame: HeroFrame) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (frame.phase === "typing") {
      body.scrollTo({ top: 0 });
      return;
    }
    if (frame.phase === "streaming") body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
  }, [frame]);
  return bodyRef;
}

/** The landing hero: a scripted chat that types a prompt, answers, and streams a catalog spec in a loop. */
export function HeroDemo() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const { frame, play } = useHeroPlayback(reduced, paused);
  const script = HERO_SCRIPTS[frame.index];
  const bodyRef = useAutoScroll(frame);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div
        className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/20"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <FrameHeader script={script} phase={frame.phase} />
        <div
          ref={bodyRef}
          className="flex h-[440px] flex-col gap-3 overflow-y-auto overscroll-contain p-3 sm:h-[520px] sm:p-4"
        >
          <UserBubble text={visiblePrompt(script, frame)} typing={frame.phase === "typing"} />
          <AssistantTurn script={script} frame={frame} />
        </div>
        <PatchTicker script={script} frame={frame} />
      </div>
      <ScriptPicker activeIndex={frame.index} onPick={play} />
    </div>
  );
}
