# Vexa starter for Next.js

The smallest Next.js App Router host for the Vexa chat overlay: one provider, one overlay, one API route. It runs with no API key against a scripted mock model; set `ANTHROPIC_API_KEY` to talk to Claude.

```bash
bun install
bun run dev:starter-next     # from the repository root, http://localhost:3004
```

| File | What it does |
|---|---|
| `app/providers.tsx` | `VexaProvider` with the chat defaults (title, suggestions, format) and `VexaChatOverlay` |
| `app/layout.tsx` | wraps every page in the provider |
| `app/api/chat/route.ts` | `createVexaHandler({ models, persona })`: `GET` lists the models, `POST` streams the reply |
| `lib/models.ts` | the model registry: Claude when the key is set, the free mock always; the first entry is the default |
| `lib/mock.ts` | the two prompts the mock answers, as text plus a spec |
| `app/globals.css` | Tailwind plus the Vexa token stylesheet |

## Use it outside this repository

Vexa is not on npm. Copy the folder, then depend on a tagged release:

1. `package.json`: add `"vexa": "github:GA-MO/vexa#v0.1.0"` (Next needs `transpilePackages: ["vexa"]`, already set in `next.config.ts`).
2. `tsconfig.json`: delete the `vexa/*` entries under `paths`; the package `exports` resolve them.
3. `app/globals.css`: `@import "vexa/styles.css";` instead of the relative path.

Then swap the provider in `lib/models.ts` for the one you use (`@ai-sdk/openai`, `@openrouter/ai-sdk-provider`, ...): Vexa takes any AI SDK `LanguageModel`.

## Next steps

- Host tools (navigate, read page state, run actions): [Host tools](https://ga-mo.github.io/vexa/docs/host/host-tools)
- Server tools, MCP and approvals: [Handler](https://ga-mo.github.io/vexa/docs/server/handler)
- Every option of the provider and the route: [Config reference](https://ga-mo.github.io/vexa/docs/config-reference)
