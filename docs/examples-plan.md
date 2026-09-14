# Examples: playable guides for every way the chat controls an app

Status: **Draft** · Revision 0 · 2026-09-14 · nothing started; supersedes the "test bench only" framing of `docs/demo-control-plan.md` without removing the runner

A good library ships three things: the package, a docs site, and example apps that show the package solving concrete cases. Vexa has the first two (`src/`, `website/`). `demo/` is a test bench: 27 scenarios under `/tests/<id>` that a runner fires at the real model to prove each control path. The scenarios *are* the examples, but they are presented as pass/fail, need an OpenRouter key, and are grouped by what they test rather than by what a host developer wants to do. This plan turns them into guides a developer can click through with no key, keeps the runner as a dev tool, and grows `demo/` into the first of several example apps.

Nothing here changes the library API. If a guide proves an API is missing, that is a separate task.

## 1. Goals

1. Anyone who clones the repo runs one example app with `bun run dev`, opens it, and can try every control pattern from a guide page with the built-in mock model. No API key, same result every time.
2. Each guide answers three questions on one screen: what the user types, what happens on the page, which lines of host code make it happen.
3. The docs site links to the examples by case ("I have an admin app", "I have a docs site", "I am not on Next.js") and the examples link back to the docs page that explains the API used.
4. `bun run test:scenarios` keeps proving the same scenarios against a real model. Guides and scenarios share one definition so they cannot drift.

## 2. Target layout

```
examples/
  shop-admin/            today's demo/, renamed. Next.js App Router, host tools, server tools + approval, page context, MCP stdio
  docs-assistant/        later: React Router + Vite SPA that embeds the overlay into a docs site (website/ is this case already; the example is the minimal version)
  embedded-widget/       later: plain Vite + React page, VexaChatOverlay only, theme + labels override, proves "not on Next.js"
website/
  content/docs/examples/ one page per example: what it demonstrates, how to run it, list of its guides
```

Renaming `demo/` is phase 4 (§7). Phases 1–3 happen inside `demo/` so the runner, the `/tests` pages and CLAUDE.md keep working during the work.

## 3. Scenario-aware mock model

`demo/lib/mock-model.ts` plays one script (reasoning → `get_orders` → reasoning → text + spec). Guides need a script per scenario.

### 3.1 Script format

```ts
type MockTurn = {
  match: RegExp | ((prompt: string) => boolean);
  steps: MockStep[];
};

type MockStep =
  | { reasoning: string }
  | { tool: string; input: Record<string, unknown> }
  | { text: string }
  | { spec: SpecPatch[] };
```

`match` runs against the text of the last user message. A `tool` step ends the model step with `finish: tool-calls`; the mock's next `doStream` call (which the AI SDK makes after the tool result arrives) continues from the step after the tool. Steps after the last tool stream in one model step. The chunk delay stays at 60 ms per word so timers, shimmers, and the collapsed "Thinking…" header are visible.

### 3.2 Where scripts live

Each scenario file gets an optional `mock: MockTurn[]` next to `script`. `demo/lib/mock-model.ts` imports the registry and picks the first `MockTurn` whose `match` hits; with no hit it answers with a fixed text so the chat never hangs. Putting the script in the scenario file is what keeps guide, runner and mock in one place.

### 3.3 Mock must know the host tools

The mock reads `options.tools` on each call and only emits a `tool` step whose name exists there; otherwise it skips the step and adds a text line "(tool X is not available on this page)". This makes a guide that runs on the wrong route fail visibly instead of silently.

### 3.4 Coverage target

Every scenario with a `script` gets a `mock` (about 20). Fixture-only scenarios (`chat-elements`, `narrow-panel`, `theme-format`, `registry`) do not need one.

## 4. Guide pages

`/tests/<id>` becomes `/guides/<id>` (keep a redirect from `/tests/<id>` for a while). One layout, driven by the `Scenario`:

| Section | Source |
|---|---|
| Title, one-line "what you learn" | `title`, `bestPractice` |
| Control path diagram (user → chat → tool → page) | `controlPath` string, rendered as 3–4 pills with arrows |
| "Try it" | each `PromptStep` in `script` becomes a button; clicking opens the overlay on the right page, selects the mock model, and submits the prompt. `PressStep` and `ApproveStep` render as instructions ("press *Load cities* in the reply") |
| What happens | the `expect*` fields rendered as plain sentences ("calls `set_filter` then answers in one sentence"), not as JSON |
| The code | the host tool(s) named in `expectTools` shown as source, extracted at build time from `demo/components/demo-host.tsx` and `demo/lib/shop/server-tools.ts` by tool name (a small script that slices `defineTool({ … })` / `tool({ … })` blocks; no runtime parsing) |
| Docs | link to the docs page for the API used (`hostTools`, `runTool`, approval, MCP, context) — a `docs: string` field added to `Scenario` |
| Last real-model run | today's pass/fail badge, shown only when `?results=1` or `NODE_ENV=development` |

`/guides` index groups scenarios by what the developer wants, not by test type:

1. Move the user around: `navigate`, `deep-link`, `page-state`
2. Read the page: `context`, `input-to-model`
3. Let generated UI act: `button-runtool`, `watch-runtool`, `server-runtool`, `form-submit`, `bound-inputs`, `patch-after-input`, `conditional-ui`, `validation`
4. Ask before acting: `approval`, `denial-semantics`, `host-to-chat`
5. Bring data: `server-tools`, `mcp-stdio`, `multi-step`
6. Stay safe: `injection`, `smoke`, `driver-smoke`
7. Look right: `chat-elements`, `narrow-panel`, `theme-format`, `keyboard`

## 5. Runner stays a dev tool

- `bun run test:scenarios` is unchanged and still defaults to the real model. `VEXA_SCENARIO_MODEL=mock` runs the same scripts against the mock; expectations that depend on model judgement (`expectText` regexes about wording) are marked `realModelOnly: true` and skipped under mock so the mock run is a pure UI/runtime check.
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
| 1 | Scenario-aware mock (§3), `mock` scripts for the 6 most-used scenarios (`navigate`, `page-state`, `context`, `button-runtool`, `approval`, `server-tools`) | each runs green under `VEXA_SCENARIO_MODEL=mock` and in the browser with the mock model picked |
| 2 | Guide page layout and `/guides` index (§4), code extraction script, `docs` field on `Scenario` | every scenario has a guide page; "Try it" works for the 6 phase-1 scenarios |
| 2b | Docs IA (§6b): regroup sidebar into Start / Integrate / Reference, fold `concepts/`, add config reference page, "Try it" links on best practices | landing links only Start + Integrate; every old URL redirects; config reference typechecks as a real snippet |
| 3 | `mock` scripts for the remaining scripted scenarios; `realModelOnly` flags | `VEXA_SCENARIO_MODEL=mock bun run test:scenarios` passes with only real-model-only steps skipped |
| 4 | Rename `demo/` → `examples/shop-admin/`, update root scripts, CLAUDE.md, vite/tsconfig aliases, docs section (§6) | `bun run dev`, `typecheck`, `test:scenarios` all work from the new path |
| 5 | `embedded-widget` example (smallest possible: one HTML page, Vite, overlay, theme + labels) | runs with the mock, has 3 guides (theme, labels/i18n, launcher position) |
| 6 | `docs-assistant` example (trimmed copy of the pattern `website/` uses: navigate + highlight tools, MCP docs source) | runs with the mock, has 3 guides |

Phases 1–3 are the payoff; 4 is housekeeping; 5–6 can wait for demand.

## 8. Open decisions

- Route name: `/guides` vs `/examples` inside the app. Leaning `/guides` because the app itself is the example.
- Whether "Try it" should also allow switching to the real model when a key is present (one toggle on the guide page) or leave that to the picker. Leaning: leave it to the picker, mention it in the page footer.
- Mock scripts as data in the scenario file (§3.2) vs a parallel `demo/lib/mock-scripts/<id>.ts`. Leaning: same file, so a scenario cannot ship without its mock.
- Whether the docs site should embed a guide inline (iframe of the running example) or only link. Leaning: link only; the example needs its own server.

## 9. Not in scope

- Any change to `src/` other than what a guide proves missing.
- Recording videos or GIFs of guides.
- Hosting the example apps publicly (would need the mock to be the only model in production builds; decide when phase 4 lands).
