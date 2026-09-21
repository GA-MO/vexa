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
        // Composer controls; each defaults to shown, the model picker only when more than one model exists.
        composer: { attachments: true, tokenUsage: true, modelPicker: undefined },
        launcherLabel: "Open assistant",
        position: "bottom-right",
        defaultOpen: false,
        // false leaves the page usable while the chat is open (no dimming, no close on outside click).
        backdrop: false,
      }}
      // Token overrides; the stylesheet declares the defaults and the dark palette.
      theme={{ primary: "#4f46e5", primaryDark: "#818cf8", radius: "0.75rem", mode: "system" }}
      // Locale and currency used by every catalog component (Metric, LineItems, charts).
      format={{ locale: "de-DE", currency: "EUR" }}
      // Extra $computed functions merged with the built-ins.
      functions={{ upper: (args) => String(args.value ?? "").toUpperCase() }}
      // Host tools: run in the browser, callable by the model and by runTool buttons; names match ^[a-z][a-z0-9_]{0,63}$.
      tools={{ navigate, set_theme: setTheme }}
      contextSchema={contextSchema}
      // Page state sent with every request (4 KB cap on the server); keep it free of secrets and PII.
      context={() => ({ path: window.location.pathname, selectedOrderId: null })}
      // Every host tool result, from the model or a button, for logging.
      onToolResult={(name, result) => console.info(name, result)}
      // Drive the page through its accessibility tree (admin_observe / admin_run / admin_discover); needs `admin` on the handler too. `navigate` covers paths with no link on the page; `confirm` is "page" (default: the app's own dialogs are the approval, the model never presses them), "mutating" (a Vexa card before the first mutating step), "all", "none" or a predicate; `discover` is "auto" (default: the app's pages are walked in a hidden frame after load and kept per user for a day), "model" (only when the model asks) or "off", or an object with `skip`, `limit`, `ttlMs`; `scope` is the signed-in user's id so the discovered pages are stored for them alone (without it: per tab); `version` is a build id that invalidates an older discovery; `passive: false` stops remembering visited pages; `pages` takes a parsed pages file for hosts that ship one.
      admin={{ navigate: (path) => window.history.pushState(null, "", path), discover: { skip: (path) => path.startsWith("/internal") }, scope: "user-42", version: "2026-09-21" }}
    >
      {children}
      <VexaChatOverlay />
    </VexaProvider>
  );
}
