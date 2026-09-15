import { Play } from "lucide-react";
import type { ReactNode } from "react";
import { CodeBlock } from "vexa/ai-elements/code-block";
import type { Guide } from "./guides/guides";

const DOCS_BASE_URL = import.meta.env.VITE_VEXA_DOCS_URL ?? "http://localhost:3002";
const CODE_SPAN = /`([^`]+)`/g;

function Prose({ text }: { text: string }) {
  const parts = text.split(CODE_SPAN);
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {parts.map((part, index) => (index % 2 === 1 ? <code key={index} className="rounded bg-muted px-1 py-0.5 text-[0.85em] text-foreground">{part}</code> : part))}
    </p>
  );
}

type GuideCardProps = {
  guide: Guide;
  code: string;
  controls: ReactNode;
  onPrompt: (prompt: string) => void;
  children?: ReactNode;
};

export function GuideCard({ guide, code, controls, onPrompt, children }: GuideCardProps) {
  return (
    <section id={guide.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{guide.title}</h2>
      {guide.what.map((paragraph) => (
        <Prose key={paragraph} text={paragraph} />
      ))}
      <div className="flex flex-wrap items-center gap-3">{controls}</div>
      <div className="flex flex-wrap items-center gap-2">
        {guide.prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Play className="size-3.5" aria-hidden />
            {prompt}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">sends the prompt to the mock model in the chat</span>
      </div>
      {children}
      <CodeBlock code={code} language="tsx" title="app.tsx" />
      <a href={`${DOCS_BASE_URL}/docs/${guide.docs}`} className="text-sm text-primary underline-offset-2 hover:underline">
        Read the docs: {guide.docs}
      </a>
    </section>
  );
}
