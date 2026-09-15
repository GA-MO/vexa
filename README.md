# Vexa

Reusable OpenRouter chat overlay that can answer in text **and** constrained generative UI ([json-render](https://json-render.dev/docs) + [AI SDK](https://ai-sdk.dev/)).

## Packages

One bun workspace, three packages:

```
package.json                        # vexa (library)
examples/shop-admin/package.json    # vexa-shop-admin (Next.js reference host, playable /guides)
examples/embedded-widget/package.json   # vexa-embedded-widget (smallest Vite integration, 4 guides)
website/package.json                # vexa-website (docs site)
```

```
src/
  protocol/   Spec + message wire types
  core/       Catalog, OpenRouter model, chat stream
  eval/       Spec validation
  react/      Registry + SpecView
  chat/       Overlay panel + composer
  ai-elements/
  ui/
mcp/          MCP App server (scripts on the library package)
examples/     example host apps; shop-admin is the reference one
website/      docs site (React Router + fumadocs)
```

## Setup

1. Copy env into the shop admin app (skip it to use only the free mock model):

```bash
cp examples/shop-admin/.env.example examples/shop-admin/.env.local
```

```env
OPENROUTER_API_KEY=...        # used only by examples/shop-admin/lib/models.ts, the library never reads env
OPENROUTER_APP_TITLE=Vexa
```

2. Install and run the shop admin:

```bash
bun install
bun run dev          # http://localhost:3001, guides at /guides
bun run dev:widget   # http://localhost:3003, the embedded widget example
bun run dev:site     # docs at http://localhost:3002
```

## Use in another project

Link or depend on this library (local example):

```json
{
  "dependencies": {
    "vexa": "file:../vexa"
  }
}
```

```tsx
// app/layout.tsx (client component around your app)
import { z } from "zod";
import { VexaProvider, defineTool } from "vexa/react";
import { VexaChatOverlay } from "vexa/chat";

<VexaProvider
  api="/api/chat"
  theme={{ primary: "#0F766E", secondary: "#0891B2", radius: "0.5rem", mode: "system" }}
  format={{ locale: "th-TH", currency: "THB" }}
  chat={{
    suggestions: [{ label: "Open settings", prompt: "Take me to the settings page." }],   // the model list comes from GET /api/chat
    labels: { emptyTitle: "ถามได้เลย", thinking: "กำลังคิด…" },                          // partial i18n override
    logo: <MyLogo className="size-4" />,
  }}
  context={() => ({ path: window.location.pathname })}
  contextSchema={z.object({ path: z.string() })}
  tools={{
    navigate: defineTool({
      description: "Open a page of this app",
      input: z.object({ to: z.string() }),
      run: ({ to }) => { router.push(to); return { ok: true, summary: `Opened ${to}` }; },
    }),
  }}
>
  {children}
  <VexaChatOverlay />
</VexaProvider>
```

```ts
// app/api/chat/route.ts
import { createVexaHandler } from "vexa/server";
import { anthropic } from "@ai-sdk/anthropic";   // the host owns the provider and its API key; vexa has none
import { stepCountIs } from "ai";

export const { GET, POST } = createVexaHandler({
  persona: ({ today, context }) => `You are the assistant for Acme's admin console. Today is ${today}; the user is on ${context.path}.`,
  toolTiers: { deleteOrders: "destructive" },   // gated tools are named in the prompt and need approval
  models: () => ({           // required; lazy so keys are read on the first request. GET publishes this list to the picker
    "claude-sonnet-4": { model: () => anthropic("claude-sonnet-4-20250514"), name: "Claude Sonnet 4", maxTokens: 200_000 },
  }),
  tools: {},                 // AI SDK server tools with execute
  mcp: [],                   // { name, transport, allow, tier } entries, see docs/host-integration-spec.md
  stopWhen: stepCountIs(6),
});
```

Schemas for `input` and `contextSchema` can be zod, valibot, arktype, or a plain `jsonSchema()` from the AI SDK. Import `vexa/styles.css` once in your global CSS (it declares the color tokens and the dark palette). Host tools registered on `VexaProvider` run in the browser: the model can call them, and buttons inside generated UI can call them through the `runTool` spec action. `vexa/server` is server-only; `vexa/core` and `vexa/react` are safe in client bundles.

## MCP

```bash
bun run mcp:build
bun run mcp:stdio
# or
bun run mcp:http
```

`.cursor/mcp.json` points at `mcp/server.ts --stdio`.

## Design docs

- [docs/host-integration-spec.md](docs/host-integration-spec.md) — how `VexaChatOverlay` will control the host app and connect to server tools / MCP (`VexaProvider`, host tools, `runTool`, `createVexaHandler`). Read this before touching `src/chat`, `src/react/runtime.ts`, or `src/core/chat.ts`.
- [docs/docs-site-plan.md](docs/docs-site-plan.md) — plan and work breakdown for the public documentation site (`website/`), with the example apps as the test bench.
- [docs/examples-plan.md](docs/examples-plan.md) — the example apps, the scenario-aware mock model, and the playable `/guides` pages.
- [DESIGN.md](DESIGN.md) — visual tokens and styling rules.
