import { jsonSchema } from "ai";
import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { VexaProvider, type VexaChatDefaults } from "vexa/react";
import { useAssistantTools } from "@/lib/assistant-tools";

const ASSISTANT_API = "/api/assistant";
const EXAMPLE_FORMAT = { locale: "en-US", currency: "THB" } as const;

const ASSISTANT_CHAT: VexaChatDefaults = {
  title: "Vexa docs guide",
  subtitle: "Finds pages, opens sections, shows examples",
  launcherLabel: "Ask the docs guide",
  suggestions: [
    { label: "Add a host tool", prompt: "How do I add a host tool?" },
    { label: "Receipt example", prompt: "Show me a receipt example" },
    { label: "Security model", prompt: "What is the security model?" },
    { label: "Chart for trends", prompt: "Which chart should I use for trends?" },
  ],
};

type PageContext = { path: string; title: string };

const PAGE_CONTEXT_SCHEMA = jsonSchema<PageContext>({
  type: "object",
  properties: {
    path: { type: "string", description: "Pathname of the page the user is reading" },
    title: { type: "string", description: "Document title of that page" },
  },
  required: ["path", "title"],
  additionalProperties: false,
});

function readPageContext(): PageContext {
  return { path: window.location.pathname, title: document.title };
}

const VexaChatOverlay = lazy(() => import("vexa/chat").then((module) => ({ default: module.VexaChatOverlay })));

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function AssistantOverlay() {
  const mounted = useMounted();
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <VexaChatOverlay />
    </Suspense>
  );
}

/** Wraps the site in the VexaProvider that powers the docs guide overlay and its page-control tools. */
export function SiteAssistant({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const tools = useAssistantTools(navigate);
  return (
    <VexaProvider
      api={ASSISTANT_API}
      chat={ASSISTANT_CHAT}
      context={readPageContext}
      contextSchema={PAGE_CONTEXT_SCHEMA}
      format={EXAMPLE_FORMAT}
      tools={tools}
    >
      {children}
      <AssistantOverlay />
    </VexaProvider>
  );
}
