# Vexa starter for Vite

The smallest Vite + React host for the Vexa chat overlay: one provider, one overlay, and the chat route as a plain fetch handler on a small `Bun.serve` server. It runs with no API key against a scripted mock model; set `ANTHROPIC_API_KEY` to talk to Claude.

```bash
bun install
bun run dev:starter-vite     # from the repository root: Vite on http://localhost:3005, the server on :3006
bun run build && bun run start   # inside this folder: the server also serves dist/
```

| File | What it does |
|---|---|
| `src/app.tsx` | `VexaProvider` with the chat defaults (title, suggestions, format), the page, and `VexaChatOverlay` |
| `server.ts` | `createVexaHandler({ models, persona })` on `Bun.serve`: `GET /api/chat` lists the models, `POST` streams the reply |
| `src/models.ts` | the model registry: Claude when the key is set, the free mock always; the first entry is the default |
| `src/mock.ts` | the two prompts the mock answers, as text plus a spec |
| `vite.config.ts` | proxies `/api` to the server in development |
| `dev.ts` | starts the server and Vite together |
| `src/app.css` | Tailwind plus the Vexa token stylesheet |

`GET` and `POST` are `(request: Request) => Promise<Response>`, so the same two lines mount on Hono (`app.all("/api/chat", (c) => c.req.method === "GET" ? GET() : POST(c.req.raw))`), Cloudflare Workers, or a Vercel function.

## Use it outside this repository

Vexa is not on npm. Copy the folder, then depend on a tagged release:

1. `package.json`: add `"vexa": "github:GA-MO/vexa#v0.1.0"`.
2. `tsconfig.json`: delete the `vexa/*` entries under `paths`; `vite.config.ts`: delete the `alias` list. The package `exports` resolve them.
3. `src/app.css`: `@import "vexa/styles.css";` instead of the relative path.

Then swap the provider in `src/models.ts` for the one you use (`@ai-sdk/openai`, `@openrouter/ai-sdk-provider`, ...): Vexa takes any AI SDK `LanguageModel`.

## Next steps

- Host tools (navigate, read page state, run actions): [Host tools](https://ga-mo.github.io/vexa/docs/host/host-tools)
- Server tools, MCP and approvals: [Handler](https://ga-mo.github.io/vexa/docs/server/handler)
- Every option of the provider and the route: [Config reference](https://ga-mo.github.io/vexa/docs/config-reference)
