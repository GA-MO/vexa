# CLAUDE.md

Vexa is a React library that embeds a chat overlay into any app. The assistant answers with text plus generative UI constrained to a catalog (json-render). The demo is a Next.js app in `demo/`.

## Commands

```bash
bun run dev          # demo at http://localhost:3001 (port 3000 may be taken by the harness project)
bun run typecheck    # tsc for root and demo. Must pass before any task is considered done
bun run build
bun run mcp:build && bun run mcp:http   # MCP provider that exposes render_ui
```

Verify a page renders without opening a browser:
```bash
curl -s http://localhost:3001/catalog | grep -c "text you expect on the page"
```
`/tests/chat-elements` renders every chat message part (user text + attachment, reasoning, every tool state, approval, dynamic tool, sources, security notice, markdown with table and code, a spec) from fixed messages in `demo/lib/test-plans/chat-elements.ts` at 340px and 600px. Open it after touching `src/chat` or `src/ai-elements`; nothing may overflow or be clipped.
`/catalog` renders one tab at a time on the client. SSR only shows the Composed tab. To check data for other tabs, evaluate the module directly: `cd demo && bun -e 'import { GALLERY_SECTIONS } from "vexa/examples"; ...'`

## Code rules

**Never write comments.** Code must explain itself. If you feel a comment is needed, fix the variable name, the function name, or extract a smaller function instead. The single exception is a one-line JSDoc on a public export that library users will see in their IDE.

- Names state intent: `hasChildren` not `flag`, `formatChartValue` not `fmt2`
- One function does one thing and fits on one screen. Two large branches (for example horizontal vs vertical) become two components
- Early return instead of nested `if`
- Repeated constants live at the top of the file as `UPPER_CASE` or a map object
- No `any`. Use `as never` only where the json-render registry forces it
- Do not add a dependency when a native element or an existing one works (`lucide-react`, `embla-carousel-react`, `zod`, `@base-ui/react`, `@ai-sdk/mcp`)
- `vexa/core` must stay client-safe. Server-only code goes behind `vexa/server`
- Code, identifiers, and UI strings are English. Gallery example content may be Thai

## Layout

```
src/core/catalog.ts          zod schema for every component + actions. Source of truth for the prompt
src/core/prompt.ts           system prompt: SHARED_INTRO + SHARED_RULES + catalog.prompt()
src/core/chat.ts             streamText + pipeJsonRender (server only). Keep `originalMessages` on createUIMessageStream: it makes host tool round trips continue the same assistant message
src/core/handler.ts          createVexaHandler: request parsing, host tools, MCP (server only)
src/core/mcp.ts              MCP client connection, allow list, tier, fence() (server only)
src/core/guard.ts            injection detection and per-turn tool downgrade
src/server/index.ts          the vexa/server entry. Never import it from client code: it pulls in child_process
src/react/components.tsx     implementation of every catalog component
src/react/registry.tsx       catalog → component map (update on every new component)
src/react/runtime.ts         spec action handlers, computed functions, directives, state namespaces
src/react/host.tsx           VexaProvider, defineTool, useVexaHost (host tools), theme wrapper
src/react/theme.ts           VexaTheme → CSS variables
src/styles.css               token declarations (@theme) and the dark palette. Hosts must import it. Every color utility used in src/ or by streamdown (popover, destructive, sidebar, success…) is declared here with a fallback to the host's shadcn variable, so a host only has to define background/foreground/card/primary/muted/accent/border/input/ring. It also styles scrollbars (thin, `foreground` at 22%, transparent track) under `[data-vexa-theme]`; add class `vexa-scrollbar` on `<html>` to get the same look page-wide (demo does; the website sets it on `html` in app.css)
src/react/spec-view.tsx      renders a spec with its state store and devtools
src/chat/                    VexaChat, VexaChatOverlay, messages, composer. `useChat` has `experimental_throttle: 50`; removing it makes fast streams throw "Maximum update depth exceeded" in hosts that mirror messages into their own state. Reasoning and tool calls render in one `ProcessSteps` block that stays collapsed ("Thinking…" while streaming, "N steps" after) unless the user expands it or a tool awaits approval. No separate plan block. The Restore checkpoint appears only under turns that have later messages (it truncates the chat back to that turn)
src/chat/constants.ts        built-in MODELS and SUGGESTIONS. Every VexaChat / overlay prop (title, subtitle, models, defaultModel, suggestions, labels, steps, launcherLabel, position, defaultOpen) can be defaulted app-wide with VexaProvider chat={{ ... }}; component props override
src/ai-elements/             shadcn-style AI Elements used as chat chrome (not catalog types). Long content wraps (`wrap-anywhere`), containers use `min-w-0` not `overflow-hidden`
demo/lib/test-plans/         fixed message sets for /tests/<case> pages
src/examples/                 example specs shared by demo (tests) and website (docs); no React here
demo/components/catalog-gallery.tsx  /catalog page with tabs and sidebar
docs/host-integration-spec.md        spec for VexaProvider / host tools / MCP. Read before touching chat, runtime, core
docs/docs-site-plan.md               plan for the public docs site in website/; demo/ is the test bench only
DESIGN.md                    design tokens (indigo → violet)
```

## Adding a catalog component touches five places

1. `src/core/catalog.ts`: schema. Every non-required prop is `.nullable()`, never `.optional()` (the model can send null but cannot omit keys). `description` is short and says when to use it and which component it replaces. `example` uses real content, not placeholders
2. `src/react/components.tsx`: takes `{ props }` plus `children` for slots, `bindings` when it binds state, `emit` when it has events. Prop types are nullable to match the schema
3. `src/react/registry.tsx`: import and entry
4. `src/core/prompt.ts`: a rule for when to use it. If it overlaps with an existing component, say which one wins
5. `src/examples/gallery.ts`: a section in `GALLERY_SECTIONS`. `src/examples/groups.ts`: the name in `CATALOG_TYPES` and a group in `PRIMITIVE_GROUPS`

Components that take user input (Input, Select, Checkbox, ...) use `useBoundProp(props.value, bindings?.value)` so `{ $bindState: "/path" }` works.

## UI rules for catalog components

- They live in a chat panel 340 to 600px wide: small padding (`p-3`, `px-3 py-2`), small gaps (Stack md = `gap-3`), `text-sm` body, Heading level 1 = `text-xl`
- Never use `space-y-*` on a container that receives spec children. Use `flex flex-col gap-*`. With devtools on, json-render wraps each element in `<span style="display:contents">`, which swallows `space-y` margins
- A Card with no children has no trailing margin (check `hasChildren`)
- Responsive rules use container queries `@md/vexa:` not viewport breakpoints, because SpecView is `@container/vexa`
- Every root element gets `w-full min-w-0` to avoid overflow in chat. Tables and code get their own `overflow-x-auto`
- Icons come from `lucide-react` through the `ICONS` map in components.tsx, never text glyphs
- SVG charts measure the real container width (`useContainerWidth`) so axis text does not scale
- `src/styles.css` registers streamdown's `@source` globs and imports `streamdown/styles.css`; without them Streamdown's Tailwind classes (sticky code actions, list markers) are missing from the host build
- Colors are tokens only: `primary` / `brand-violet` (accent gradient), `foreground` / `muted-foreground`, `card` / `muted` / `border` / `input` / `ring`, and `success` / `warning` / `danger` / `info`. Charts use `var(--chart-1..5)`. Never write `indigo-600`, `slate-500`, `bg-white`, or a hex color in `src/` (the dark code block in `Code` is the one exception). `VexaProvider theme` overrides the variables; `src/styles.css` declares them and the dark palette

## Spec and state

- Buttons use `on.press: [{ action, params }]`. Actions must be declared in `catalog.actions` or validation rejects them
- Templates use `${/path}`, not `{{path}}`
- `visible: { $state: "/path" }` and `{ $state, not: true }` show or hide elements
- `repeat: { statePath, key }` re-renders the whole element per item. Children read `{ $item: "field" }`
- State namespaces: `/tools/*` and `/host/*` are reserved for the runtime (writes from specs are dropped with a warning). Everything else is writable; prefer `/ui/*` for user-entered values
- UI generated after a tool call must patch the existing spec. json-render merges every `data-spec` part in a message into one spec

## Prompt layers

`src/core/prompt.ts` assembles: persona (host, may be a function of `{ today, context, tools, req }`) → intro + catalog rules (+ host `rules`) → operational rules (only when tools exist: grounding, approval, denial semantics) → host `instructions` → fenced host context → **library invariants, always last**. Never move the invariants block or let host text follow it. Tool outputs reach the model through `toModelOutput` fencing (`fenceAsData`); the UI-visible output is untouched. A flagged tool result downgrades the turn to read tools and streams a `data-notice` part that `messages.tsx` renders.

## Where config lives

- Server (`createVexaHandler` in the route, env vars): model registry and default, persona / rules / instructions, server tools, MCP, stopWhen, approval secret, guard, provider options, API keys. Anything that costs money, grants capability, or is prompt text
- Client (`VexaProvider`, overlay props): presentation (title, subtitle, suggestions, labels for i18n, launcher, position), `format` (locale + currency used by every catalog component), extra `$computed` `functions`, the model picker list (ids must exist in the server registry), host tools and page context. The server fences and size-caps everything the client sends
- Built-in spec actions are only `submitForm`, `toast`, `runTool`. Host-specific behavior is a host tool called through `runTool` (from buttons or `watch`), never a new action baked into the library
- Never add a client-controlled field that changes server behavior without validating it against a server-side list
- Config that comes in pairs must be typed together, not only checked at runtime: `contextSchema` infers the type of `context` on `VexaProvider<S>`, `defineTool` infers `run` input from `input`. When adding a new paired option, make the wrong combination a TypeScript error first
- Never require zod from hosts. Schema-shaped options take AI SDK `FlexibleSchema` (Standard Schema or `jsonSchema()`) and go through `asSchema()`; zod is only for the catalog
- Models: the library never imports a provider or reads an API key. The host passes AI SDK `LanguageModel` instances (or lazy `() => model` entries with name/maxTokens) in `createVexaHandler({ models })`; `GET /api/chat` publishes that list and the chat picker fetches it, so ids live in one place. The demo does this in `demo/lib/models.ts` with OpenRouter; `@openrouter/ai-sdk-provider` is a demo dependency only

## Working in this repo

- Never commit unless asked
- End every task with `bun run typecheck` and a curl of the page you changed
- The Chrome extension usually does not connect. Rely on SSR HTML and data evaluation instead of screenshots
- The reference project at `/Users/sbpdigital/Development/harness` runs on `ai` ^7. Borrow patterns, never copy API names. This repo is on `ai` 6
