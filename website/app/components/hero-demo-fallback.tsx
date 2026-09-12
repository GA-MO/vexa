import { Sparkles } from "lucide-react";
import { HERO_SCRIPTS } from "@/lib/hero-script";

const FIRST_SCRIPT = HERO_SCRIPTS[0];

/** Same footprint as HeroDemo so the streamed hero drops in without a layout shift. */
export function HeroDemoFallback() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/20">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-brand-violet text-primary-foreground">
              <Sparkles className="size-3.5" aria-hidden />
            </span>
            <span className="truncate text-sm font-medium text-foreground">Acme assistant</span>
          </div>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {FIRST_SCRIPT.title}
          </span>
        </div>
        <div className="flex h-[440px] flex-col gap-3 p-3 sm:h-[520px] sm:p-4">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-md shadow-primary/25">
            {FIRST_SCRIPT.prompt.join("")}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{FIRST_SCRIPT.prose.join(" ")}</p>
        </div>
        <div className="flex items-center gap-3 border-t border-border bg-muted/60 px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
            spec stream · loading the renderer
          </code>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            0/{FIRST_SCRIPT.patches.length}
          </span>
        </div>
      </div>
      <div className="h-11" aria-hidden />
    </div>
  );
}
