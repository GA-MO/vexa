# Agentic UI

Reusable OpenRouter chat overlay that can answer in text **and** constrained generative UI ([json-render](https://json-render.dev/docs) + [AI SDK](https://ai-sdk.dev/)).

## Packages

Exactly two packages:

```
package.json          # agentic-ui (library)
demo/package.json     # agentic-ui-demo (Next host preview)
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
demo/         Next.js preview host
```

## Setup

1. Copy env into the demo app:

```bash
cp demo/.env.example demo/.env.local
```

```env
OPENROUTER_API_KEY=...
AGENT_MODEL=google/gemini-3.1-flash-lite
OPENROUTER_APP_TITLE=Agentic-UI
```

2. Install and run the demo:

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) (or the next free port if 3000 is taken). Catalog review: [http://localhost:3000/catalog](http://localhost:3000/catalog).

## Use in another project

Link or depend on this library (local example):

```json
{
  "dependencies": {
    "agentic-ui": "file:../agentic-ui"
  }
}
```

```ts
import { AgenticChatOverlay } from "agentic-ui/chat";
import { streamAgentChat } from "agentic-ui/core";
```

Point the overlay `api` prop at that project’s chat route, and call `streamAgentChat` from the route handler.

## MCP

```bash
bun run mcp:build
bun run mcp:stdio
# or
bun run mcp:http
```

`.cursor/mcp.json` points at `mcp/server.ts --stdio`.
