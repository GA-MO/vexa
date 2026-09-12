import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { CheckIcon, ClipboardCopyIcon, Sparkles } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { VexaChat, type ChatSuggestion } from "vexa/chat";
import type { VexaMessage } from "vexa/protocol";
import { CodeSurface } from "@/components/code-surface";
import { baseOptions } from "@/lib/layout.shared";
import {
  EMPTY_INSPECTION,
  exampleSource,
  inspectMessages,
  stateSource,
  type PlaygroundInspection,
} from "@/lib/playground";

const CHAT_API = "/api/chat";
const INSPECTOR_TABS = ["Spec", "JSONL", "State"];
const COPY_FEEDBACK_MS = 2000;

const PLAYGROUND_SUGGESTIONS: readonly ChatSuggestion[] = [
  { label: "KPI dashboard", prompt: "Show 3 KPI metrics for an online shop with a revenue bar chart by month" },
  { label: "Pricing table", prompt: "Compare three subscription plans in a table with a call-to-action button per plan" },
  { label: "Signup form", prompt: "Build a signup form with name, email, plan select and a submit button" },
  { label: "Order timeline", prompt: "Show the status of order #4821 as a timeline with a progress bar" },
];

type CopyState = "idle" | "copied" | "failed";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useCopy(text: string | null) {
  const [state, setState] = useState<CopyState>("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [state]);
  const copy = useCallback(() => {
    if (text === null) return;
    navigator.clipboard
      .writeText(text)
      .then(() => setState("copied"))
      .catch(() => setState("failed"));
  }, [text]);
  return { state, copy };
}

export function meta() {
  return [
    { title: "Playground | Vexa" },
    {
      name: "description",
      content: "Type a prompt, watch the spec stream, and copy the result as a test example.",
    },
  ];
}

export default function PlaygroundRoute() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Playground</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Type a prompt and the assistant answers with text plus catalog UI. The inspector shows the
            spec it produced, the JSONL patches as they streamed, and the state the spec declares.
          </p>
        </header>
        <Playground />
      </div>
    </HomeLayout>
  );
}

function Playground() {
  const mounted = useMounted();
  const [messages, setMessages] = useState<VexaMessage[]>([]);
  const settledMessages = useDeferredValue(messages);
  const inspection = useMemo(() => inspectMessages(settledMessages), [settledMessages]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-[min(720px,calc(100dvh-11rem))] min-h-[520px] min-w-0">
        {mounted ? (
          <VexaChat
            api={CHAT_API}
            onMessagesChange={setMessages}
            subtitle="Every reply renders catalog UI"
            suggestions={PLAYGROUND_SUGGESTIONS}
            title="Vexa playground"
          />
        ) : (
          <ChatShell />
        )}
      </div>
      <Inspector inspection={inspection} />
    </div>
  );
}

function ChatShell() {
  return (
    <section
      aria-busy
      className="flex h-full flex-col items-center justify-center gap-3 rounded-[1.35rem] border border-border/70 bg-card text-card-foreground"
    >
      <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-brand-violet/15 text-primary">
        <Sparkles className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">Loading the chat…</p>
    </section>
  );
}

function Inspector({ inspection }: { inspection: PlaygroundInspection }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const spec = inspection.spec;
  const source = useMemo(
    () => (spec ? exampleSource(inspection, spec, today) : null),
    [inspection, spec, today],
  );
  const { state, copy } = useCopy(source);
  const hasSpec = spec !== null;

  return (
    <section
      aria-label="Inspector"
      className="flex min-h-[520px] min-w-0 flex-col gap-3 rounded-[1.35rem] border border-border/70 bg-card p-4 text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Inspector</h2>
          <p className="text-xs text-muted-foreground">
            {hasSpec ? "Latest assistant reply" : "Send a prompt to see the spec here"}
          </p>
        </div>
        <CopyExampleButton disabled={!hasSpec} onClick={copy} state={state} />
      </div>
      {hasSpec ? (
        <Tabs className="my-0 min-w-0" items={INSPECTOR_TABS}>
          <Tab>
            <JsonSurface filename="spec.json" lang="json" text={JSON.stringify(spec, null, 2)} />
          </Tab>
          <Tab>
            <JsonSurface filename="spec.jsonl" lang="jsonl" text={inspection.jsonl} />
          </Tab>
          <Tab>
            <p className="mb-2 text-xs text-muted-foreground">
              Initial state declared by the spec. Values the user changes live in the SpecView store
              and are not shown here.
            </p>
            <JsonSurface filename="state.json" lang="json" text={stateSource(spec)} />
          </Tab>
        </Tabs>
      ) : (
        <InspectorEmpty />
      )}
    </section>
  );
}

function InspectorEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/40 p-6 text-center">
      <p className="text-sm font-medium">Nothing to inspect yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Pick a suggestion or type a prompt. The spec, its JSONL stream and its state appear here
        while the answer streams.
      </p>
    </div>
  );
}

const COPY_LABELS: Record<CopyState, string> = {
  idle: "Copy as example",
  copied: "Copied",
  failed: "Copy failed",
};

function CopyExampleButton({
  disabled,
  onClick,
  state,
}: {
  disabled: boolean;
  onClick: () => void;
  state: CopyState;
}) {
  const Icon = state === "copied" ? CheckIcon : ClipboardCopyIcon;
  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-brand-violet px-3 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      title="Copy a ComposedExample object literal for src/examples/composed.ts"
      type="button"
    >
      <Icon className="size-3.5" />
      {COPY_LABELS[state]}
    </button>
  );
}

function JsonSurface({ filename, lang, text }: { filename: string; lang: "json" | "jsonl"; text: string }) {
  return <CodeSurface className="my-0" lang={lang} title={filename} code={text} viewportClassName="max-h-[560px]" />;
}
