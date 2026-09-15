# Examples: playable guides for every way the chat controls an app

Status: **In progress** · Revision 3 · 2026-09-15 · phases 1, 2, 2b, 3 and 4 done, next is 5 on demand; supersedes the "test bench only" framing of `docs/demo-control-plan.md` without removing the runner

A good library ships three things: the package, a docs site, and example apps that show the package solving concrete cases. Vexa has the first two (`src/`, `website/`). `examples/shop-admin/` is a test bench: 27 scenarios under `/tests/<id>` that a runner fires at the real model to prove each control path. The scenarios *are* the examples, but they are presented as pass/fail, need an OpenRouter key, and are grouped by what they test rather than by what a host developer wants to do. This plan turns them into guides a developer can click through with no key, keeps the runner as a dev tool, and grows `examples/shop-admin/` into the first of several example apps.

Nothing here changes the library API. If a guide proves an API is missing, that is a separate task. Guides proved four library gaps, all fixed on the way: `VexaChatOverlay backdrop={false}` (the dim backdrop blocked the page the assistant was driving); forwarded `⟦action⟧` user messages render as a button press instead of raw text; catalog `Input` with `inputType: "number"` binds a number; a patch-only follow-up reply continues the previous reply's spec in place (`src/chat/spec-continuation.ts`), without which "add a button to that form" rendered nothing. Plus one behaviour change needed by phase 2: `VexaChat` now follows a changed `defaultModel` (prop or `VexaProvider chat`) until the user picks a model in the composer; before, the default was read once at mount, so a guide could not switch a chat that was already open to the mock.

## 1. Goals

1. Anyone who clones the repo runs one example app with `bun run dev`, opens it, and can try every control pattern from a guide page with the built-in mock model. No API key, same result every time.
2. Each guide answers three questions on one screen: what the user types, what happens on the page, which lines of host code make it happen.
3. The docs site links to the examples by case ("I have an admin app", "I have a docs site", "I am not on Next.js") and the examples link back to the docs page that explains the API used.
4. `bun run test:scenarios` keeps proving the same scenarios against a real model. Guides and scenarios share one definition so they cannot drift.

## 2. Target layout

```
examples/
  shop-admin/            the former demo/, renamed 2026-09-15. Next.js App Router, host tools, server tools + approval, page context, MCP stdio
  docs-assistant/        later: React Router + Vite SPA that embeds the overlay into a docs site (website/ is this case already; the example is the minimal version)
  embedded-widget/       later: plain Vite + React page, VexaChatOverlay only, theme + labels override, proves "not on Next.js"
website/
  content/docs/examples/ one page per example: what it demonstrates, how to run it, list of its guides
```

Renaming `examples/shop-admin/` is phase 4 (§7). Phases 1–3 happen inside `examples/shop-admin/` so the runner, the `/tests` pages and CLAUDE.md keep working during the work.

## 2b. What the scenarios actually are (review, 2026-09-14)

The 27 scenarios are three kinds, and a guide plays each kind differently:

| Kind | Count | Scenarios | How "Try it" works |
|---|---|---|---|
| Model turn (`user` step) | 15 | smoke, navigate, deep-link, page-state, context, approval, denial-semantics, server-tools, mcp-stdio, injection, server-runtool, host-to-chat, input-to-model, patch-after-input, theme-format | the mock model answers the prompt (§3) |
| Runtime only (press / type / expectState, no model) | 8 | driver-smoke, button-runtool, watch-runtool, form-submit, multi-step, validation, bound-inputs, conditional-ui | the mock answers the `opener` prompt with the fixture as a spec, so the reader uses it inside the chat; no scripted turn beyond that |
| Fixture / HTTP / manual | 4 | chat-elements, narrow-panel, keyboard, registry | look, or read the sentence |

Three of them (`smoke`, `driver-smoke`, `registry`) are runner checks, not lessons: `Scenario.kind: "check"` keeps them off the guide index. `server-runtool`, `host-to-chat` and `input-to-model` are hybrids: a live fixture button forwards a `⟦action⟧ runTool …` message, and the mock's `match` is a regex on that forwarded text.

Two scenarios only pass with state the page does not have by default (`context` wants `selectedOrderId: C-1042`; `page-state` step 2 needs step 1 to have run). Phase 2 adds `Scenario.setup` (select an order, set a filter) that the guide applies before opening the chat, and plays `user` steps one button at a time in order; the host has no `onFinish`, so an automatic "play all" would need a library change and is out of scope.

Host tool descriptors were duplicated between `demo-host.tsx` (zod) and five scenario files (hand-written JSON schema), with drifting descriptions. Phase 1 moves the shared part to `examples/shop-admin/lib/shop/host-tools.ts` (`description` + zod `input`; `hostToolDescriptor(name)` derives the JSON schema) so the runner, the app, and the guide's "The code" section see one definition.

## 3. Scenario-aware mock model

`examples/shop-admin/lib/mock-model.ts` played one script (reasoning → `get_orders` → reasoning → text + spec). Guides need a script per scenario.

### 3.1 Script format

```ts
type MockTurn = {
  match: RegExp | ((prompt: string) => boolean);
  steps: MockStep[];
};

type MockStep =
  | { reasoning: string }
  | { text: string }
  | { spec: Spec }
  | { patch: SpecPatch[] }
  | { tool: string; input: Record<string, unknown>; then: MockContinuation; onError?: MockContinuation };

type MockContinuation = MockStep[] | ((output: unknown) => MockStep[]);
```

`match` runs against the text of the last user message. A `tool` step must be the last step of its array and ends the model step with `finish: tool-calls`; its continuation is `then` (or `onError` when the result is `{ ok: false }`, which is what a rejected approval produces), called with the parsed tool output so a text can quote real numbers. `spec` takes a flat `Spec` (the same object a fixture holds) and the mock turns it into patch lines; `patch` is for scenarios that patch a prior spec. The chunk delay stays at 60 ms per word so timers, shimmers, and the collapsed "Thinking…" header are visible.

**Cursor.** Every `doStream` call receives the whole conversation. The mock finds the last user message, matches it to a turn, counts the tool results that follow that message, and walks the turn: each result consumes the next `tool` step and replaces the remaining steps with that step's continuation. What is left streams until the next `tool` step (finish `tool-calls`) or the end (finish `stop`). This is what makes host tool round trips, server tool steps and multi-turn scenarios (`page-state` has two user turns) all land on the right line of the script.

### 3.2 Where scripts live

Each scenario file gets an optional `mock: MockTurn[]` next to `script`. `examples/shop-admin/lib/mock-model.ts` imports the registry and picks the first `MockTurn` whose `match` hits, in registry order; with no hit it answers with a fixed text so the chat never hangs. Putting the script in the scenario file is what keeps guide, runner and mock in one place.

### 3.3 Mock must know the host tools

The mock reads `options.tools` on each call and only emits a `tool` step whose name exists there; otherwise it streams "(tool X is not available on this page)" and stops. This makes a guide that runs on the wrong route fail visibly instead of silently.

### 3.4 Coverage target

Every model-turn scenario has a `mock` (15). Runtime-only and fixture-only scenarios do not need one.

## 4. Guide pages

`/tests/<id>` becomes `/guides/<id>` (keep a redirect from `/tests/<id>` for a while). One layout, driven by the `Scenario`:

| Section | Source |
|---|---|
| Title, one-line "what you learn" | `title`, `bestPractice` |
| Control path diagram (user → chat → tool → page) | `controlPath` string, rendered as 3–4 pills with arrows |
| "Try it" | a scenario with a fixture gets an `opener` prompt (`Scenario.opener`, default "Show the <id> example") that the mock answers with text + the fixture spec, so the UI appears as a chat reply and its buttons run there; forwarded-button scenarios then point at the button in that reply. Each typed `user` step in `script` becomes a button, enabled in order; clicking applies `setup`, opens the overlay on the right page (`useChatControls().openChat`) and submits the prompt through `sendToChat` (the overlay stays mounted while closed, so this works before it is open). Guide pages set `chat.defaultModel: "mock"` so a click never spends real-model money silently; the picker still allows switching. Runtime-only scenarios render the fixture live instead of a button. `press`, `type`, `approve` and `request` steps render as instructions or sentences, never as buttons |
| What happens | the `expect*` fields rendered as plain sentences ("calls `set_filter` then answers in one sentence"), not as JSON |
| The code | every tool the scenario touches (`expectTools`, approvals, `runTool` targets in its fixture) shown as source, sliced by tool name from `examples/shop-admin/lib/shop/host-tools.ts`, `examples/shop-admin/components/demo-host.tsx` and `examples/shop-admin/lib/shop/server-tools.ts` at request time (`examples/shop-admin/lib/scenarios/tool-sources.ts`: from the `name:` line to the closing brace at the same indent; no TS parsing, no generated files) |
| Docs | link to the docs page for the API used (`hostTools`, `runTool`, approval, MCP, context) — a `docs: string` field added to `Scenario` |
| Last runner result | pass/fail badge, model id and step log from `.scenario-results.json`, shown only when `NODE_ENV=development` |

`/guides` index groups scenarios by what the developer wants, not by test type:

1. Move the user around: `navigate`, `deep-link`, `page-state`
2. Read the page: `context`, `input-to-model`
3. Let generated UI act: `button-runtool`, `watch-runtool`, `server-runtool`, `form-submit`, `bound-inputs`, `patch-after-input`, `conditional-ui`, `validation`, `multi-step`
4. Ask before acting: `approval`, `denial-semantics`, `host-to-chat`
5. Bring data: `server-tools`, `mcp-stdio`
6. Stay safe: `injection`
7. Look right: `chat-elements`, `narrow-panel`, `theme-format`, `keyboard`

`smoke`, `driver-smoke` and `registry` are `kind: "check"` and stay on the runner only.

## 5. Runner stays a dev tool

- `bun run test:scenarios` is unchanged and still defaults to the real model. `VEXA_SCENARIO_MODEL=mock` runs the same scripts against the mock and passes 27/27 (mcp-stdio needs `VEXA_DEMO_MCP=1` on both the server and the runner). No `realModelOnly` flag was needed: every expectation is satisfiable by a script because `then(output)` can quote real tool results and `steps(prompt)` can read a forwarded ⟦action⟧ message. Results record the model id, so a mock run never passes for a real one on a guide page.
- Results JSON stays where it is; the guide page reads it only for the dev badge.
- The `/tests` index is replaced by `/guides`; `docs/demo-control-plan.md` gets a pointer to this file.

## 6. Docs site

- New section `website/content/docs/examples/` with `meta.json`, `index.mdx` (the three cases and which to open first), and `shop-admin.mdx` (how to run, list of guides with one-line descriptions, link to each `/guides/<id>` on the running app).
- `docs/host/best-practices.mdx` keeps its paragraphs; each gains a "Try it: shop-admin → guide `<id>`" line.
- Landing page gets an "Examples" tile next to Playground.

## 6b. Docs information architecture (agreed 2026-09-14)

Scenario and example case are different axes: a scenario is one mechanism (navigate, approval, watch → runTool) and is the unit of a guide; an example case is one kind of app (admin, docs site, widget) that composes several mechanisms on one integration shape. Guides are written once per scenario; a case lists the guides it contains.

The docs have two readers. A host developer integrating the package needs about six pages. Someone writing a persona, checking what "UI back" looks like, or feeding the site assistant / llms.txt needs the catalog. Today the sidebar puts every section at the same level, which reads as "read all of it". Regroup by reader; delete nothing:

```
Start        get-started, examples (which case looks like yours)
Integrate    provider, route + models, host tools, runTool, approval, theme, labels, config reference
Reference    catalog, actions, recipes, security model, state, spec stream, agents
```

- `concepts/` pages fold into Reference (`catalog`, `security-model`, `spec-stream`, `state`) or Integrate (`host-tools`).
- New page **config reference**: one annotated `createVexaHandler({ … })` and one `VexaProvider` block with every option and a one-line comment each, copy-pasteable. Detail per option stays on the existing Integrate pages; this page does not repeat it.
- Best practices stay on `/docs/host/best-practices`, synced with scenario `bestPractice`; each paragraph gains a "Try it" link to its guide (§6).
- Landing page links Start and Integrate only. Reference is reachable from the sidebar and search.
- Phase for this work: 2b, right after the guide pages exist, because Start → examples needs something to link to.

## 7. Phases

| Phase | Work | Done when |
|---|---|---|
| 1 ✓ | Scenario-aware mock (§3), `Scenario.kind` and `Scenario.mock`, shared host tool definitions (§2b), `mock` scripts for the 6 most-used model-turn scenarios (`navigate`, `page-state`, `context`, `approval`, `server-tools`, `deep-link`) | each runs green under `VEXA_SCENARIO_MODEL=mock` and in the browser with the mock model picked |
| 2 ✓ | Guide page layout and `/guides` index (§4), `Scenario.setup` and `docs` fields, code slicing, `/tests/*` redirects (`/tests/chat-elements` stays: it is a render check, and the chat-elements guide links to it) | every guide-kind scenario has a guide page; "Try it" works for the 7 mocked scenarios and the live fixture works for the 8 runtime-only ones |
| 2b ✓ | Docs IA (§6b): sidebar regrouped with `---Start---` / `---Integrate---` / `---Reference---` separators in `content/docs/meta.json`; `concepts/` folded (state and spec-stream moved to the root, catalog → `/docs/catalog#how-the-catalog-works`, host-tools → `/docs/host/host-tools`, security-model → `/docs/security`) with 301s in `app/lib/docs-redirects.ts` for HTML and `.md`; `examples/` section (§6); `config-reference.mdx` includes `config-reference/route.ts` and `provider.tsx`, which the website tsconfig typechecks; the `.md` twin inlines `<include>` files as code fences; every best-practice bullet ends with a *Try it* link to its guide | landing links only Start + Integrate; every old URL redirects; config reference typechecks as a real snippet |
| 3 ✓ | `mock` scripts for the remaining 8 model-turn scenarios; `MockTurn.steps` may be a function of the prompt (forwarded ⟦action⟧ inputs); `examples/shop-admin/lib/scenarios/action-message.ts` replaces three copies of the forwarded-message format | `VEXA_SCENARIO_MODEL=mock bun run test:scenarios` passes 27/27 |
| 4 ✓ | `git mv demo examples/shop-admin` (2026-09-15); workspace `examples/*`, root scripts `--cwd examples/shop-admin`, tsconfig/globals.css/next.config paths one level deeper, `tool-sources.ts` labels files `examples/shop-admin/…`, CLAUDE.md, README, docs and website content repointed | `bun run dev`, `typecheck`, `VEXA_SCENARIO_MODEL=mock test:scenarios` (27/27) all work from the new path |
| 5 | `embedded-widget` example (smallest possible: one HTML page, Vite, overlay, theme + labels) | runs with the mock, has 3 guides (theme, labels/i18n, launcher position) |
| 6 | `docs-assistant` example (trimmed copy of the pattern `website/` uses: navigate + highlight tools, MCP docs source) | runs with the mock, has 3 guides |

Phases 1–3 are the payoff; 4 is housekeeping; 5–6 can wait for demand.

## 8. Open decisions

Decided 2026-09-14: route is `/guides`; guide pages default to the mock and leave switching to the picker; mock scripts live in the scenario file; the docs site links to guides and never embeds them.

- Whether "play all" (sequential user steps with no clicks) is worth a host-visible `onFinish` on `VexaProvider`. Not before phase 2 shows the one-button-per-step version is not enough.

## 9. Not in scope

- Any change to `src/` other than what a guide proves missing.
- Recording videos or GIFs of guides.
- Hosting the example apps publicly (would need the mock to be the only model in production builds; decide when phase 4 lands).
