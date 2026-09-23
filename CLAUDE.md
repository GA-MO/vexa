# CLAUDE.md

Vexa is a React library that embeds a chat overlay into any app. The assistant answers with text plus generative UI constrained to a catalog (json-render). The example apps live in `examples/`: `examples/shop-admin/` is the Next.js reference host (the demo), `examples/embedded-widget/` the smallest Vite integration (overlay or inline chat, no tools, handler mounted on the Vite dev server), `examples/starter-next/` and `examples/starter-vite/` the copyable starters (the Get started page as a folder: provider, overlay, chat route, a registry that falls back to the mock when `ANTHROPIC_API_KEY` is unset; not hosted on Pages, docs link to their source), and `src/mock/` (`vexa/mock`) the scripted mock model engine every example uses.

## Commands

```bash
bun install          # one bun workspace: root (the library), examples/*, website/. Apps resolve `vexa/*` through tsconfig paths and the vite alias, not a package link; one React copy for everything
bun run dev          # shop admin at http://localhost:3001 (pinned in examples/shop-admin/package.json)
bun run dev:widget   # embedded widget at http://localhost:3003
bun run dev:starter-next   # Next.js starter at http://localhost:3004
bun run dev:starter-vite   # Vite starter at http://localhost:3005 (its Bun.serve chat route on :3006)
bun run test         # bun test with happy-dom (bunfig.toml preload): src/admin/*.test.ts and examples/shop-admin/lib/*.test.tsx render real pages without a browser
bun run eval:ui -- --mode=on|off [--runs=5] [--pace=ms]   # generative-UI eval on shop-admin: a ui case passes only when the spec data matches lib/shop/data.ts (lib/eval-ui/spec-read.ts resolves `{ $state }` bindings against the spec state), every run is also scored by the model on a 0–6 rubric; VEXA_EVAL_LABEL=<model> keeps one .eval-ui.<label>.json per model, docs/admin-ui-eval.md summarises every label; `--runs=0 --rescore --report` re-verifies stored replies after a change to the checks without calling the model
bun run probe -- "prompt" [--page=/orders] [--runs=3] [--no-admin]   # one prompt against the dev server with the real model (VEXA_SCENARIO_MODEL picks it): tools, text, spec outline per run; VEXA_SCENARIO_DEBUG=1 prints the part sequence. Use it before touching a prompt rule, then eval:ui to measure
bun run typecheck    # tsc for root, every example and website. Must pass before any task is considered done
bun run build
bun run mcp:build && bun run mcp:http   # MCP provider that exposes render_ui
bun run build:pages  # static, mock-only builds of docs + both examples in pages-site/ (what .github/workflows/pages.yml deploys to GitHub Pages)
```

Verify a page renders without opening a browser:
```bash
curl -s http://localhost:3001/orders | grep -c "C-1042"
```
`/tests/chat-elements` renders every chat message part (user text + attachment, a forwarded button press, reasoning, every tool state, approval, dynamic tool, sources, security notice, markdown with table and code, a spec) from fixed messages in `src/examples/chat-elements.ts` at 340px and 600px. The same file feeds the docs page `website/content/docs/host/chat-elements.mdx` (one example per element, server-rendered). Open both after touching `src/chat` or `src/ai-elements`; nothing may overflow or be clipped.
`bun run test:scenarios [id…]` runs `examples/shop-admin/lib/test-plans/*.ts` against the dev server with the real model (`--steering` runs only the scenarios whose `measures: "steering"` checks that the prompt steers a real model; `measures: "runtime"` ones are proven by the mock; admin scenarios pass on the outcome — `expectStore` over the shop store, `expectPage` over the DOM host — not on the tool sequence) (`examples/shop-admin/scripts/run-scenarios.ts` mirrors useChat: host tool round trips, approvals, ⟦action⟧ forwarding). `/guides` lists every guide-kind scenario grouped by what the developer wants (`examples/shop-admin/lib/scenarios/guide-groups.ts`); `/guides/<id>` renders one: control path, "Try it" (prompt buttons that apply `setup`, go to `page`, open the chat and send with the mock; a scenario with a fixture gets an `opener` prompt the mock answers with that fixture as a spec, so the reader uses it inside the chat like a real reply; forwarded-button scenarios point at the button in the reply instead of showing the ⟦action⟧ text), the script as prose (`describe.ts`), the mock script, the tool sources sliced from the app (`tool-sources.ts`), the `docs` link, and in development the last runner result. `/tests/*` redirects there. Add a scenario for every new control path and keep its `bestPractice` line in sync with `docs/control-best-practices.md`. The model picker also offers `mock` (`vexa/mock` is the engine, `createScriptedModel({ turns, prompts })` in `src/mock/scripted-model.ts`; `examples/shop-admin/lib/mock-model.ts` feeds it every scenario's `mock: MockTurn[]` and plays the turn matching the last user message through the real handler, no API key, no cost; a `tool` step must close its array and continue through `then` / `onError`, see `docs/examples-plan.md` §3); use it or `VEXA_SCENARIO_MODEL=mock` to check chat UI and runtime behaviour, never to judge how a prompt steers a model. Host tool descriptions and input schemas live once in `examples/shop-admin/lib/shop/host-tools.ts`; `demo-host.tsx` spreads them into `defineTool`, scenarios call `hostToolDescriptor(name)`.
`examples/shop-admin` is the Vexa Shop admin test bench (`/`, `/orders`, `/orders/[id]`, `/products`, `/products/new`, `/products/[id]`, `/settings`, `/guides`; the product pages have no host tools on purpose, the chat drives them through `admin_run`): data in `examples/shop-admin/lib/shop/data.ts`, store in `examples/shop-admin/lib/shop/store.tsx`, host tools in `examples/shop-admin/components/demo-host.tsx`, server tools in `examples/shop-admin/lib/shop/server-tools.ts`. The catalog gallery lives on the docs site (`website/`), which renders `src/examples`; to check example data without a browser, evaluate the module directly: `cd examples/shop-admin && bun -e 'import { GALLERY_SECTIONS } from "vexa/examples"; ...'`

## Code rules

**Never write comments.** Code must explain itself. If you feel a comment is needed, fix the variable name, the function name, or extract a smaller function instead. The single exception is a one-line JSDoc on a public export that library users will see in their IDE.

- Names state intent: `hasChildren` not `flag`, `formatChartValue` not `fmt2`
- One function does one thing and fits on one screen. Two large branches (for example horizontal vs vertical) become two components
- Early return instead of nested `if`
- Repeated constants live at the top of the file as `UPPER_CASE` or a map object
- No `any`. Use `as never` only where the json-render registry forces it
- Do not add a dependency when a native element or an existing one works (`lucide-react`, `embla-carousel-react`, `zod`, `@base-ui/react`, `@ai-sdk/mcp`)
- `vexa/core` must stay client-safe. Server-only code goes behind `vexa/server`
- Code, identifiers, UI strings, docs and example content are English. No Thai anywhere in docs or examples; i18n examples use German (de-DE / EUR)

## Layout

```
src/core/catalog.ts          zod schema for every component + actions. Source of truth for the prompt
src/core/prompt.ts           system prompt: SHARED_INTRO + SHARED_RULES + catalog.prompt()
src/core/chat.ts             streamText + pipeJsonRender (server only). Keep `originalMessages` on createUIMessageStream: it makes host tool round trips continue the same assistant message
src/core/handler.ts          createVexaHandler: request parsing, host tools, MCP (server only)
src/core/mcp.ts              MCP client connection, allow list, tier, fence() (server only)
src/core/guard.ts            injection detection and per-turn tool downgrade
src/server/index.ts          the vexa/server entry. Never import it from host client code. The stdio MCP transport is a dynamic import, so the static example builds can run createVexaHandler in the browser (`serveChatInBrowser` from vexa/mock routes /api/chat fetches to it)
src/react/components.tsx     implementation of every catalog component
src/react/registry.tsx       catalog → component map (update on every new component)
src/react/runtime.ts         spec action handlers, computed functions, directives, state namespaces
src/react/host.tsx           VexaProvider, defineTool, useVexaHost (host tools), theme wrapper. Default props (`chat`, `functions`, `tools`) are module constants: an inline `{}` default re-runs the schema effect on every render and loops
src/react/theme.ts           VexaTheme → CSS variables
src/styles.css               token declarations (@theme) and the dark palette. Hosts must import it. Every color and radius utility used in src/ or by streamdown is declared here as `var(--shadcn-name, light default)`, plus the `dark` variant, so a host with no tokens of its own renders the indigo light palette and a shadcn host keeps its values. `theme.glow: false` sets `data-vexa-glow="off"`, which blanks the `--vexa-glow*` shadows and hides `.vexa-glow` elements. It also styles scrollbars (thin, `foreground` at 22%, transparent track) under `[data-vexa-theme]`; add class `vexa-scrollbar` on `<html>` to get the same look page-wide (shop-admin does; the website sets it on `html` in app.css)
src/react/spec-view.tsx      renders a spec with its state store and devtools
src/admin/                   the vexa/admin entry: snapshot (a11y tree → refs/roles/names), resolve, actions, run (executor), schema (flat step object for the model), tools (admin_observe / admin_run / admin_discover, confirm policy: default `page` = the app's own confirmation dialog is the approval, the run stops when one opens and never presses inside it; `mutating` = a Vexa card first), dialogs (what counts as a confirmation dialog), cache/passive (the observation cache and the route watcher), frame (automatic discovery: a hidden same-origin iframe named `vexa-discover`, sandboxed without top navigation, walks the links after load; the provider inside it registers nothing, `isVexaFrame()`), store (the result per origin in sessionStorage, or localStorage under `scope` = the signed-in user, 24 h TTL, `version` invalidates), seed/sync (the optional deterministic `vexa-pages.json` a dev server can write through `PUT /api/chat`; shop-admin no longer ships one). Subtrees with `data-vexa-ignore` never reach a snapshot. Three non-obvious rules: the executor yields one macrotask after every input step so React has rendered before the next target resolves; a `display: contents` wrapper (the provider's own theme element, json-render's devtools spans) counts as visible even though `checkVisibility()` says no; and stored pages are restored in an effect, never during render, or SSR and the first client render disagree (hydration error)
src/chat/                    VexaChat (`layout`: panel = framed card in its box, inline = flush in its box, page = viewport with a centered max-w-3xl column), VexaChatOverlay, messages, composer. `useChat` has `experimental_throttle: 50`; removing it makes fast streams throw "Maximum update depth exceeded" in hosts that mirror messages into their own state. Reasoning and tool calls render in one `ProcessSteps` block that stays collapsed ("Thinking…" while streaming, "N steps" after) unless the user expands it or a tool awaits approval. No separate plan block. The Restore checkpoint appears only under turns that have later messages (it truncates the chat back to that turn)
src/chat/constants.ts        built-in MODELS and SUGGESTIONS. Every VexaChat / overlay prop (title, subtitle, models, defaultModel, suggestions, labels, steps, composer, launcherLabel, position, defaultOpen, backdrop) can be defaulted app-wide with VexaProvider chat={{ ... }}; component props override. `composer` switches off attachments, the model picker (hidden by itself with one model) and the token meter. Popups (dialog, dropdown, hover card, select, tooltip) portal into the VexaProvider theme element through `src/lib/portal.tsx` so they inherit the tokens and dark mode; `--color-popover` has a solid fallback for hosts with no tokens. A changed `defaultModel` re-applies until the user picks a model in the composer (the demo uses this to switch guides to the mock)
src/ai-elements/             shadcn-style AI Elements used as chat chrome (not catalog types). Long content wraps (`wrap-anywhere`), containers use `min-w-0` not `overflow-hidden`
examples/shop-admin/lib/test-plans/   one Scenario per control path: script, fixture, mock, docs, setup; feeds /guides and the runner
src/examples/                 example specs shared by the example apps and website (docs); no React here
examples/shop-admin/components/demo-host.tsx   VexaProvider for the shop admin: host tools, context, chat defaults, overlay
examples/shop-admin/lib/shop/            shop data, client store, server tools for the test bench
docs/host-integration-spec.md        spec for VexaProvider / host tools / MCP. Read before touching chat, runtime, core
docs/docs-site-plan.md               plan for the public docs site in website/; the example apps are the test bench. Sidebar groups are separators in website/content/docs/meta.json (Start / Integrate / Reference); a moved page gets a 301 in website/app/lib/docs-redirects.ts; website/content/docs/config-reference.mdx <include>s two real files next to it that the website typecheck covers, and the .md twin inlines them as code fences; every best-practice bullet ends with a Try it link to its /guides/<id>
docs/demo-control-plan.md            original plan for the demo (now examples/shop-admin) as a control test bench (scenario framework, runner); guide pages superseded it
docs/admin-plan.md                   plan for driving any React admin from the chat with generic steps (admin_observe / admin_run host tools over the accessibility tree, no per-feature tools, no data-vexa-* markup). Read before touching src/admin/, the admin prop on VexaProvider, or admin: true on createVexaHandler; phases 0–11 have checkboxes, mark them as you go
docs/roadmap.md                      product roadmap after admin control: shared spec state, canvas beside the chat, chatless useVexaUI, host components, threads, headless hook, identity at the tool layer. Phases 0–7 have checkboxes, mark them as you go; read before starting any of them
docs/examples-plan.md                current plan: scenario-aware mock model, /guides playable guide pages, docs IA, demo/ → examples/shop-admin, embedded-widget (all done), docs-assistant example (on demand). Read before touching demo/lib/mock-model.ts, demo/lib/scenarios or /guides
DESIGN.md                    design tokens (indigo → violet)
```

## Adding a catalog component touches five places

1. `src/core/catalog.ts`: schema. Every non-required prop is `.nullable()`, never `.optional()` (the model can send null but cannot omit keys). `description` is short and says when to use it and which component it replaces. `example` uses real content, not placeholders
2. `src/react/components.tsx`: takes `{ props }` plus `children` for slots, `bindings` when it binds state, `emit` when it has events. Prop types are nullable to match the schema
3. `src/react/registry.tsx`: import and entry
4. `src/core/prompt.ts`: a rule for when to use it. If it overlaps with an existing component, say which one wins
5. `src/examples/gallery.ts`: a section in `GALLERY_SECTIONS`. `src/examples/groups.ts`: the name in `CATALOG_TYPES` and a group in `PRIMITIVE_GROUPS`

Components that take user input (Input, Select, Checkbox, ...) use `useBoundProp(props.value, bindings?.value)` so `{ $bindState: "/path" }` works.

An approval card never shows a tool name or its raw input: `ToolApproval` renders the host's `describeToolCall(name, input)` when there is one, otherwise the humanized tool name plus the input's top-level scalar fields as label/value rows. Nested values stay in the collapsed tool block. A host that wants to draw the whole decision passes `VexaProvider renderApproval`, which gets the tool, its input, the state and `approve` / `reject`, and falls back to `ToolApproval` when it returns null. Approvals render under the reply text, never inside `ProcessSteps` — collapsing "Thinking" must not hide a decision the user has to make, and the decision reads after the sentence that leads to it.

A **host** component touches none of those five: the host calls `extendCatalog({ components })` for the schema and prompt, passes that catalog to `createVexaHandler({ catalog })`, and passes its renderers to `VexaProvider components`. `VexaProvider normalizeSpec` rewrites a spec before it renders, for a host that wants to enforce its own card contract.

## UI rules for catalog components

- They live in a chat panel 340 to 600px wide: small padding (`p-3`, `px-3 py-2`), small gaps (Stack md = `gap-3`), `text-sm` body, Heading level 1 = `text-xl`
- Never use `space-y-*` on a container that receives spec children. Use `flex flex-col gap-*`. With devtools on, json-render wraps each element in `<span style="display:contents">`, which swallows `space-y` margins
- A Card with no children has no trailing margin (check `hasChildren`)
- Responsive rules use container queries `@md/vexa:` not viewport breakpoints, because SpecView is `@container/vexa`
- Every root element gets `w-full min-w-0` to avoid overflow in chat. Tables and code get their own `overflow-x-auto`
- Icons come from `lucide-react` through the `ICONS` map in components.tsx, never text glyphs
- SVG charts measure the real container width (`useContainerWidth`) so axis text does not scale
- `src/styles.css` registers streamdown's `@source` globs and imports `streamdown/styles.css`; without them Streamdown's Tailwind classes (sticky code actions, list markers) are missing from the host build
- Colors are tokens only: `primary` / `brand-violet` (accent gradient), `foreground` / `muted-foreground`, `card` / `muted` / `border` / `input` / `ring`, and `success` / `warning` / `danger` / `info`. Charts use `var(--chart-1..5)`. Never write `indigo-600`, `slate-500`, `bg-white`, or a hex color in `src/`. Code (catalog `Code`, tool input/output) renders through `src/ai-elements/code-block.tsx`: token colors, JSON highlight, horizontal scroll, copy button. `VexaProvider theme` overrides the variables; `src/styles.css` declares them and the dark palette

## Spec and state

- Buttons use `on.press: [{ action, params }]`. Actions must be declared in `catalog.actions` or validation rejects them
- Templates use `${/path}`, not `{{path}}`
- `visible: { $state: "/path" }` and `{ $state, not: true }` show or hide elements
- `repeat: { statePath, key }` re-renders the whole element per item. Children read `{ $item: "field" }`
- State namespaces: `/tools/*` and `/host/*` are reserved for the runtime (writes from specs are dropped with a warning). Everything else is writable; prefer `/ui/*` for user-entered values
- UI generated after a tool call must patch the existing spec. json-render merges every `data-spec` part in a message into one spec. A later assistant message whose spec parts are patches only (no `/root`) continues the previous reply's spec in place (`src/chat/spec-continuation.ts`): the earlier SpecView gets the patches and keeps its state, the later message shows only its text

## Prompt layers

`src/core/prompt.ts` assembles: persona (host, may be a function of `{ today, context, tools, req }`) → intro + catalog rules (+ host `rules`) → operational rules (only when tools exist: grounding, approval, denial semantics) → host `instructions` → fenced host context → **library invariants, always last**. Never move the invariants block or let host text follow it. Tool outputs reach the model through `toModelOutput` fencing (`fenceAsData`); the UI-visible output is untouched. A flagged tool result downgrades the turn to read tools and streams a `data-notice` part that `messages.tsx` renders.

## Where config lives

- Server (`createVexaHandler` in the route, env vars): model registry and default, persona / rules / instructions, server tools, MCP, stopWhen, approval secret, guard, provider options, API keys. Anything that costs money, grants capability, or is prompt text
- Client (`VexaProvider`, overlay props): presentation (title, subtitle, suggestions, labels for i18n, launcher, position), `format` (locale + currency used by every catalog component), extra `$computed` `functions`, the model picker list (ids must exist in the server registry), host tools and page context. The server fences and size-caps everything the client sends
- Built-in spec actions are only `submitForm`, `toast`, `runTool`. A `runTool` whose name is not a host tool forwards `⟦action⟧ runTool <name> <json>` to the chat (`formatActionMessage`); the chat renders such a user message as a button press (`parseActionMessage`; `buttonPressed(tool)` defaults to the tool name as words, input shown as key/value pairs), never as raw text or JSON. Catalog `Input` with `inputType: "number"` binds a number, so a forwarded input satisfies `z.number()` tool schemas. Host-specific behavior is a host tool called through `runTool` (from buttons or `watch`), never a new action baked into the library
- Never add a client-controlled field that changes server behavior without validating it against a server-side list
- Config that comes in pairs must be typed together, not only checked at runtime: `contextSchema` infers the type of `context` on `VexaProvider<S>`, `defineTool` infers `run` input from `input`. When adding a new paired option, make the wrong combination a TypeScript error first
- Never require zod from hosts. Schema-shaped options take AI SDK `FlexibleSchema` (Standard Schema or `jsonSchema()`) and go through `asSchema()`; zod is only for the catalog
- Models: the library never imports a provider or reads an API key. The host passes AI SDK `LanguageModel` instances (or lazy `() => model` entries with name/maxTokens) in `createVexaHandler({ models })`; `GET /api/chat` publishes that list and the chat picker fetches it, so ids live in one place. The demo does this in `examples/shop-admin/lib/models.ts`: every provider whose key is set in `.env.local` is listed, QwenCloud (`QWEN_API_KEY`, OpenAI-compatible; `deepseek-v4-flash-0731` is the default and the model the scenarios and `bun run eval:ui` use, thinking off unless `VEXA_QWEN_THINKING=1`) first, then DeepSeek, Google AI Studio, Groq, Anthropic, OpenRouter; the provider packages are shop-admin dependencies only

## Working in this repo

- Never commit unless asked
- Releases: `bun run release X.Y.Z` on a clean, synced `main` (bumps `package.json`, rewrites the `github:GA-MO/vexa#vX.Y.Z` install snippets, commits, tags, pushes; `release.yml` packs `src/` and publishes the GitHub Release). Read `docs/release.md` before cutting one; only `src/` ships (`files` in package.json), so a new entry point needs `exports` plus tsconfig `paths` everywhere
- End every task with `bun run typecheck` and a curl of the page you changed
- The Chrome extension usually does not connect. Rely on SSR HTML and data evaluation instead of screenshots
- The reference project at `/Users/sbpdigital/Development/harness` runs on `ai` ^7. Borrow patterns, never copy API names. This repo is on `ai` 6
