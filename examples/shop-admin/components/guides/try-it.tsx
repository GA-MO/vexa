"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { useChatControls } from "@/components/demo-host";
import type { GuideRun } from "@/lib/scenarios/guide-run";

const GUIDES_PREFIX = "/guides";

function PromptButtons({ run }: { run: GuideRun }) {
  const { tryPrompt } = useChatControls();
  const [nextIndex, setNextIndex] = useState(0);
  return (
    <ol className="flex flex-col gap-2">
      {run.prompts.map((prompt, index) => {
        const isNext = index === nextIndex;
        const done = index < nextIndex;
        return (
          <li key={prompt} className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={index > nextIndex}
              onClick={() => {
                tryPrompt({ prompt, page: run.page, setup: index === 0 ? run.setup : null });
                setNextIndex(index + 1);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isNext ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              <Play className="size-3.5" aria-hidden />
              {prompt}
            </button>
            {done ? <span className="text-xs text-muted-foreground">sent</span> : null}
          </li>
        );
      })}
      {nextIndex >= run.prompts.length && run.prompts.length > 0 ? (
        <li>
          <button type="button" onClick={() => setNextIndex(0)} className="text-xs text-primary underline-offset-2 hover:underline">
            Start over
          </button>
        </li>
      ) : null}
    </ol>
  );
}

export function TryIt({ run }: { run: GuideRun }) {
  const hasPrompts = run.prompts.length > 0;
  const hasOwnPage = !run.page.startsWith(GUIDES_PREFIX) && !hasPrompts;
  return (
    <div className="flex flex-col gap-4">
      {hasOwnPage ? (
        <p className="text-sm text-foreground">
          Scenario page:{" "}
          <Link href={run.page} className="text-primary underline-offset-2 hover:underline">
            {run.page}
          </Link>
          .
        </p>
      ) : null}
      {hasPrompts ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Each button sends its prompt to the assistant with the mock model, on the page the scenario expects. Press them in order; switch the model in
            the chat to see a real model handle the same prompt.
          </p>
          <PromptButtons run={run} />
        </div>
      ) : null}
      {run.forwardingButtons.map((button) => (
        <p key={button.label} className="text-sm text-foreground">
          Then use the reply in the chat: fill in its fields and press <strong>{button.label}</strong>. The button forwards its input back into the chat
          as a <code>{button.tool}</code> request and the mock model answers it.
        </p>
      ))}
      {run.manualChecks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {run.manualChecks.map((check) => (
            <li key={check} className="flex items-start gap-2 text-sm text-foreground">
              <input type="checkbox" className="mt-1 size-3.5 shrink-0" aria-label={check} />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!hasPrompts && run.manualChecks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to click here: this scenario is checked by the runner only.</p>
      ) : null}
    </div>
  );
}
