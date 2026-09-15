"use client";

import { VexaChatOverlay } from "vexa/chat";
import { defineTool, VexaProvider } from "vexa/react";
import { z } from "zod";
import "vexa/styles.css";

const navigate = defineTool({
  // First sentence for the model, argument hints after it; truncated to 300 characters.
  description: "Open one of the admin pages: / (overview), /orders, or /settings.",
  // Any Standard Schema (zod, valibot, arktype) or an AI SDK jsonSchema(); `run` is typed from it.
  input: z.object({ to: z.enum(["/", "/orders", "/settings"]) }),
  run: ({ to }) => {
    window.history.pushState(null, "", to);
    return { ok: true, summary: `Opened ${to}` };
  },
});

const setTheme = defineTool({
  description: "Switch the page between light and dark theme. This opens its own confirmation prompt, do not ask the user to confirm in chat first.",
  input: z.object({ theme: z.enum(["light", "dark"]) }),
  // Shows a Run / Cancel card before `run`, whether the model or a button called it.
  confirm: true,
  run: ({ theme }) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return { ok: true, data: { theme } };
  },
});

// Typed together with `context`: the provider infers the shape from the schema and validates it on every request.
const contextSchema = z.object({ path: z.string(), selectedOrderId: z.string().nullable() });

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <VexaProvider
      // Endpoint for POST (chat) and GET (model list); default "/api/chat".
      api="/api/chat"
      // App-wide chat defaults; every VexaChat / VexaChatOverlay prop can be set here and overridden per component.
      chat={{
        title: "Acme assistant",
        subtitle: "Ask about orders",
        suggestions: [{ label: "Pending orders", prompt: "Show pending orders" }],
        // Presentation only: ids must exist in the server registry, which GET /api/chat publishes when this is omitted.
        defaultModel: "google/gemini-2.5-flash",
        // i18n and wording; every label has an English default.
        labels: { emptyTitle: "Ask anything about orders", buttonPressed: (toolName) => `Pressed: ${toolName}` },
        // "collapsible" (default) shows reasoning and tool calls in one steps block; "hidden" keeps only approval cards.
        steps: "collapsible",
        launcherLabel: "Open assistant",
        position: "bottom-right",
        defaultOpen: false,
        // false leaves the page usable while the chat is open (no dimming, no close on outside click).
        backdrop: false,
      }}
      // Token overrides; the stylesheet declares the defaults and the dark palette.
      theme={{ primary: "#4f46e5", primaryDark: "#818cf8", radius: "0.75rem", mode: "system" }}
      // Locale and currency used by every catalog component (Metric, LineItems, charts).
      format={{ locale: "th-TH", currency: "THB" }}
      // Extra $computed functions merged with the built-ins.
      functions={{ upper: (args) => String(args.value ?? "").toUpperCase() }}
      // Host tools: run in the browser, callable by the model and by runTool buttons; names match ^[a-z][a-z0-9_]{0,63}$.
      tools={{ navigate, set_theme: setTheme }}
      contextSchema={contextSchema}
      // Page state sent with every request (4 KB cap on the server); keep it free of secrets and PII.
      context={() => ({ path: window.location.pathname, selectedOrderId: null })}
      // Every host tool result, from the model or a button, for logging.
      onToolResult={(name, result) => console.info(name, result)}
    >
      {children}
      <VexaChatOverlay />
    </VexaProvider>
  );
}
