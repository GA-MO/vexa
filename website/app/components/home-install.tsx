import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CodeSurface } from "@/components/code-surface";
import { HomeSection } from "@/components/home-section";

const INSTALL_COMMAND = "bun add vexa";
const COPIED_FEEDBACK_MS = 1600;

const PROVIDER_SNIPPET = `"use client";

import { VexaProvider } from "vexa/react";
import { VexaChatOverlay } from "vexa/chat";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VexaProvider format={{ locale: "en-US", currency: "USD" }} chat={{ title: "Acme assistant" }}>
      {children}
      <VexaChatOverlay />
    </VexaProvider>
  );
}`;

const ROUTE_SNIPPET = `import { createVexaHandler } from "vexa/server";
import { models } from "@/lib/models";

export const { GET, POST } = createVexaHandler({ models });`;

const STEPS = [
  { step: "1", title: "Install", body: "One package. Bring your own AI SDK provider and keep the key on the server." },
  { step: "2", title: "Wrap your app", body: "VexaProvider carries format, chat defaults, and host tools. The overlay renders inside it." },
  { step: "3", title: "Add the route", body: "createVexaHandler returns GET and POST. GET publishes the model registry; POST streams text plus patches." },
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => setCopied(true));
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}

function CodePanel({ filename, code }: { filename: string; code: string }) {
  return <CodeSurface lang="tsx" className="my-0 w-full min-w-0" title={filename} code={code} />;
}

function InstallCommand() {
  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card py-1.5 pl-4 pr-1.5 shadow-lg shadow-primary/10">
      <span className="font-mono text-sm text-muted-foreground" aria-hidden>
        $
      </span>
      <code className="flex-1 font-mono text-sm font-medium text-foreground">{INSTALL_COMMAND}</code>
      <CopyButton text={INSTALL_COMMAND} label="Copy install command" />
    </div>
  );
}

function StepList() {
  return (
    <ol className="flex flex-col gap-5">
      {STEPS.map((item) => (
        <li key={item.step} className="flex gap-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-brand-violet font-display text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30">
            {item.step}
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HomeInstall() {
  return (
    <HomeSection
      id="install"
      eyebrow="Five minutes"
      title="Install, wrap, route"
      lede="Three files and your assistant answers with real components. No provider is bundled: you pass AI SDK models and the key never leaves the server."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
        <div className="flex flex-col gap-8">
          <InstallCommand />
          <StepList />
          <Link
            to="/docs/get-started"
            className="inline-flex min-h-11 w-fit items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
          >
            Follow the full guide
          </Link>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <CodePanel filename="app/providers.tsx" code={PROVIDER_SNIPPET} />
          <CodePanel filename="app/api/chat/route.ts" code={ROUTE_SNIPPET} />
        </div>
      </div>
    </HomeSection>
  );
}
