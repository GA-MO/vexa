# Roadmap: from chat widget to generative UI layer

Status: **Proposed** · Revision 1 · 2026-09-21 · no phase started. Read `docs/host-integration-spec.md` and `docs/admin-plan.md` first; this plan builds on both and changes nothing they decided.

Vexa today is a chat overlay that answers with catalog UI and can drive the page it lives on. That is one cell of the map the market draws: CopilotKit's generative UI page splits UI into *controlled* (host components, agent picks one), *declarative* (agent sends a spec, frontend renders it) and *open* (agent sends HTML), and splits surfaces into *chat*, *chat+* (a canvas beside the chat) and *chatless* (the agent talks to the app, the app renders). Vexa is declarative-in-chat, and nothing else. Its json-render renderer is not a differentiator any more (CopilotKit's Dojo ships a `@json-render/react` demo next to A2UI and Hashbrown).

What Vexa has that the alternatives do not, verified against their docs and Dojo on 2026-09-21:

- **Driving an existing React admin with no per-feature code** (`admin_observe` / `admin_run` / `admin_discover` over the accessibility tree). CopilotKit needs a `useFrontendTool` per operation.
- **Safety by construction**: a closed catalog, tool tiers, approval cards, an injection guard that downgrades the turn, fenced tool output.
- **One library, no runtime, no cloud, no provider import**, a scripted mock model so anyone can try it without a key.
- **Measurement**: `eval:ui` checks the spec data against the source of truth, `probe` and the scenario runner check steering.

What they have that matters for the same buyer (a product team adding an assistant to a React app): a canvas beside the chat, UI outside the chat, state that flows both ways between page and model, host-owned components, thread persistence, headless hooks, per-user auth at the tool layer. Their canvas is **state-driven and developer-rendered**: the agent streams a typed state, the page renders it with components the developer wrote, and `setState` sends edits back. The agent never designs UI outside the chat. That gap is the opening.

Not on this roadmap, on purpose: the AG-UI protocol, other frontend frameworks, Slack/Teams surfaces, analytics dashboards, self-learning, a hosted cloud, and open (HTML) generative UI. The first five are a company's worth of work that would produce a thinner CopilotKit. The last one contradicts the one-line promise ("what is not in the catalog cannot be rendered"). If AG-UI becomes the standard, an adapter at the handler is one phase; the stream is already events.

## 1. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **The spec is the shared state.** A spec rendered anywhere (chat, canvas, page slot) keeps its state in one store the host can read and write, and the next turn sends the current `/ui/*` values with the request. | Today `/ui/*` lives inside `SpecView` and dies with it; the model only learns a user's edits when a button forwards them (`patch-after-input`). Making the store first-class gives "shared state" without a second protocol: the model already knows how to bind and patch `/ui/*`. |
| D2 | **The canvas renders a spec the model designed, not a state the developer rendered.** `VexaCanvas` receives the spec parts of the latest reply and renders them at full width; the chat keeps the text. | This is the cell nobody fills. A state-driven canvas needs the developer to write every component the agent can populate, which is the per-feature cost admin control removed on the tool side. |
| D3 | **Chatless UI goes through the same handler.** `useVexaUI` posts one prompt with context to `/api/chat` and returns a spec plus its store; no second model path, no second prompt assembly. | "Where config lives" and the admin plan's D3 both forbid a second model path. The handler already accepts `context`, `hostTools`, guards and fences; a `mode: "ui"` field that suppresses the composer-facing text is a small addition validated server side. |
| D4 | **Host components enter the catalog through `defineComponent`, mirroring `defineTool`.** Schema (AI SDK `FlexibleSchema`), description, render. The server validates the names against the client's declared list exactly like host tools, and the prompt lists them after the built-in catalog. | Keeps the closed catalog: the host declares, the model picks. Never zod from hosts (schema goes through `asSchema()`); the description cap and count cap match `hostToolSchema`. |
| D5 | **Persistence is an adapter, not a store.** `VexaProvider chat={{ threads: { load, save, list } }}` with `VexaMessage[]` as the unit; the library never chooses a database. | Every demo loses its thread on reload. The library must not pick storage (cloud is out of scope) but must define the shape so hosts write ten lines, not a hundred. `onMessagesChange` already exists on `VexaChat`; this generalises it. |
| D6 | **Headless is exported, the chrome stays default.** `useVexaChat` is the hook `VexaChat` is built on; `VexaChat` keeps working unchanged. | Hosts that reject our chrome today have no path. Extracting the hook is refactoring, not a new surface, and every existing scenario keeps proving it. |
| D7 | **Identity reaches the tool layer through the handler, never the client.** `createVexaHandler({ identify: (req) => ({ id, tiers }) })`: the tiers a user may reach and the `scope` the admin store already keys on come from the same function. | A client-controlled field that changes server behaviour is forbidden. The admin store already has `scope` for the signed-in user; the tool tiers do not know the user yet. |
| D8 | **Debt first.** Publish to npm, commit the working tree, cover chat and runtime with `bun test` before any phase above ships. | A roadmap on top of fifty uncommitted files and a git-tag install is not credible to the buyer this plan targets. |

## 2. The surfaces after this plan

```
                          createVexaHandler (/api/chat)
                    text + spec patches + tool parts + state
   ┌──────────────────────────┼──────────────────────────────┐
   │                          │                              │
 VexaChat / Overlay       VexaCanvas                    useVexaUI(prompt)
 (chat, unchanged)        (spec of the latest reply,    (chatless: a spec + store,
  text stays here          full width, same store)       no composer, no thread)
   │                          │                              │
   └──────────── one spec store per reply (D1) ─────────────┘
                    /ui/* read + write by the host (useVexaSpecState)
                    sent with the next request as `uiState`
```

## 3. Phases

Each phase ends with `bun run typecheck`, `bun run test`, the scenarios it names, a docs page and a guide on `/guides` (CLAUDE.md: a scenario for every new control path).

### Phase 0 — debt (before anything else)

- [ ] Commit the working tree in coherent commits (admin phases 8–11, react-admin trial, eval judge, starters).
- [ ] Publish `vexa` to npm from `release.yml` next to the GitHub Release; keep the `github:` snippet as the fallback. Update `docs/release.md` and the install snippets the release script rewrites.
- [ ] `bun test` for `src/chat` (spec continuation, action messages, approval flow) and `src/react/runtime.ts` (guarded store, namespaces, computed functions). The admin folder is covered; the chat is only covered by the runner against a live server.
- [ ] A comparison page in the docs (`website/content/docs/why-vexa.mdx`): the three-pillar / three-surface map with Vexa's cell marked, what is deliberately out of scope, one paragraph per differentiator above. Rewritten at the end of each phase below.

### Phase 1 — shared spec state (D1)

- [ ] Lift the store out of `SpecViewInner`: `createSpecSession(spec)` in `src/react/spec-session.ts` owns the guarded store, the tool outputs (`/tools/*`), and host context (`/host/*`); `SpecView` takes an optional `session` and creates one when absent (existing behaviour).
- [ ] `useVexaSpecState(path)` returns `[value, set]` for any writable path on the latest session; `useVexaSpec()` returns the spec and session of the latest assistant reply. Both live in `src/react/host.tsx` next to `useVexaHost`.
- [ ] The request body gains `uiState: Record<string, unknown>` (the `/ui/*` subtree of the latest session, capped at 4 KB like `context`, validated in `handler.ts`); the prompt's host context fence shows it under "Current form values" only when non-empty.
- [ ] Scenario `shared-state`: the model renders a form, the user edits a field without pressing anything, asks a follow-up, the reply reflects the edit (`expectPage` on the DOM, mock turn asserting `uiState` reached the handler).
- [ ] Docs: `host/state.mdx`. `docs/host-integration-spec.md` §state namespaces gains `uiState`.

### Phase 2 — the canvas (D2)

- [ ] `VexaCanvas` in `src/chat/canvas.tsx`: renders the spec of the latest assistant reply from the provider's chat session at full width (`SpecView` with the shared session, container width from the slot). Empty state text from `chat.labels`.
- [ ] `VexaChat` / overlay prop `specTarget: "chat" | "canvas"` (default `chat`). With `canvas` the message list shows text and steps only, and a one-line "Shown in the canvas" placeholder where the spec would be; the spec continuation logic in `src/chat/spec-continuation.ts` is unchanged because the session is shared.
- [ ] Prompt: one operational rule keyed on `specTarget` (sent in the body, validated as an enum) so the model may use wider layouts (Grid with more columns, larger charts) when the target is a canvas. The catalog does not change; the container queries already adapt.
- [ ] shop-admin: `/` (the dashboard) gets a canvas column beside the overlay in a `layout: "panel"` arrangement, driven by the same scenarios as today. Scenario `canvas-reply` proves that a metrics question renders in the canvas and the chat shows the sentence.
- [ ] `/tests/chat-elements` gains the canvas placeholder; nothing overflows at 340 px.
- [ ] Docs: `host/canvas.mdx`, a guide, screenshots in the README.

### Phase 3 — chatless UI (D3)

- [ ] `useVexaUI({ prompt, context, deps })` in `src/react/use-vexa-ui.ts`: posts to the handler with `mode: "ui"`, streams the spec into a session, returns `{ spec, session, status, error, refresh }`. No messages array, no composer, no thread.
- [ ] Handler: `mode: "ui"` (enum, validated) uses the same prompt layers with an extra operational rule ("reply with UI only, one sentence of text at most") and no tools beyond read tier. Mock engine: a `ui` turn kind so guides can play it.
- [ ] Buttons in a chatless spec still call host tools through `runTool`; a `runTool` whose name is not a host tool is an error in this mode (there is no chat to forward `⟦action⟧` to). Documented, tested.
- [ ] shop-admin: the products list gets an "Insights" block above the table rendered by `useVexaUI` from the page's data; the starters get the same block behind a flag.
- [ ] Scenario `chatless-block`, docs `host/chatless.mdx`.

### Phase 4 — host components (D4)

Partly built for Cop (2026-09-23), server-catalog-first rather than over the wire: a host defines its components once in a catalog it owns and passes that catalog to both ends.

- [x] `extendCatalog({ components, actions })` (`src/core/catalog.ts`, which now exports `vexaComponents` / `vexaActions`); `createVexaHandler({ catalog })` threads it to `buildAgentInstructions({ catalog })`, so host components reach `catalog.prompt()` with their own descriptions and examples.
- [x] `VexaProvider components` merges a host's renderers over `registry` for every `SpecView` (json-render `ComponentRegistry` is a plain map); `SpecView components` overrides per view.
- [x] `VexaProvider normalizeSpec: (spec, { toolOutputs }) => spec` — the host rewrites a spec before it renders, which is how a host enforces its own card contract on a model that drew one by hand.
- [x] `VexaProvider describeToolCall: (name, input) => { title, question?, details? }` — approval cards and button-press bubbles read as sentences, not as tool names and payloads.
- [x] `VexaProvider renderApproval: ({ tool, input, state, approved, approve, reject }) => ReactNode` — the host draws the decision itself (Cop's CEO decision card: who gets the work, what it asks, what approving does) and returns null to keep Vexa's own approval card. Approvals also moved below the reply text in `AssistantMessage`: the decision reads after the explanation it follows from.
- [ ] `defineComponent({ name, description, props: FlexibleSchema, render })` so one declaration feeds both the catalog and the registry; today the host writes the zod schema and the renderer separately. The name is prefixed `host_` on the wire so the server can trust it like `admin_`.
- [ ] Body field `hostComponents: { name, description, schema }[]`, capped like `hostTools` (32, 300-character descriptions); `catalog.prompt()` gains a "Host components" section listing them after the built-in catalog with the rule "prefer a host component when one matches the data exactly".
- [ ] Validation: a spec element whose type is a host component not in the request's list is rejected by the same path that rejects unknown actions.
- [ ] Gallery: host components appear in the docs gallery under their own group only in the example that defines them (shop-admin defines `OrderCard` and `ProductThumb`).
- [ ] Scenario `host-component`, docs `host/components.mdx`, the "Adding a catalog component touches five places" rule in CLAUDE.md gains "a host component touches none of them".

### Phase 5 — threads (D5)

- [ ] `chat.threads: { list, load, save, remove }` on `VexaProvider`, all async, `VexaMessage[]` in and out, ids chosen by the host. The chat calls `save` through the existing `onMessagesChange` path (throttled) and `load` on mount when an id is given.
- [ ] Thread switcher in the chat header (behind `composer.threads`, off by default), labels in `chat.labels`.
- [ ] Spec sessions survive a reload: a saved thread restores every `SpecView` with its `/ui/*` values (the state travels in a `data-ui-state` part appended on save, dropped on send).
- [ ] shop-admin: `localStorage` adapter in `lib/threads.ts`; starters ship the same adapter as the reference implementation.
- [ ] Scenario `thread-restore`, docs `host/threads.mdx`.

### Phase 6 — headless (D6)

- [ ] `useVexaChat(options)` extracted from `VexaChat`: messages, status, send, stop, regenerate, restore-to-turn, pending confirmations, models, the throttle. `VexaChat` becomes a thin composition of the hook and the existing components.
- [ ] `AssistantMessage` / `UserMessage` and the composer parts are already exported; document the assembly in `host/headless.mdx` with a fifty-line custom chat in `examples/embedded-widget`.
- [ ] Every existing scenario passes unchanged (the hook is what the runner mirrors already).

### Phase 7 — identity at the tool layer (D7)

- [ ] `createVexaHandler({ identify })` returns `{ id, tiers?: ToolTier[], scope?: string }` from the request; the tier filter for server tools, MCP and `admin_run` uses it; the prompt's persona function receives it; the client reads `scope` from `GET /api/chat` for the admin store instead of a client prop.
- [ ] shop-admin: a fake sign-in switch in the top nav (viewer / operator / admin) that changes a cookie; scenarios `identity-viewer-denied` and `identity-admin-allowed`.
- [ ] Docs: `server/identity.mdx`; `docs/host-integration-spec.md` §6 gains the identity row in the threat model.

## 4. Order and why

Phase 1 before 2 and 3 because both render outside the chat and are useless if the state dies with the widget; phase 2 before 3 because the canvas reuses the chat's stream and proves the shared session on a real page before a second request mode exists. Phase 4 after 2 because host components show their value at canvas width. Phases 5–7 are independent of each other and of 2–4; they are last because they change no story, they remove objections.

## 5. Definition of done

A developer with a Next.js admin can, from the docs alone and in one afternoon: install from npm, mount the overlay, put a canvas on the dashboard, drop one chatless insights block on a list page, register two of their own components, keep threads across reloads, and restrict destructive tools to admins. Every step has a guide on `/guides` that plays with the mock, and `bun run eval:ui` still passes at the score recorded in `docs/admin-ui-eval.md`.

## 6. Open questions

- Should `uiState` (phase 1) travel on every request or only when the model's last reply bound inputs? Sending always is simpler; measure the token cost on the eval set first.
- One session per reply or one per thread? Per reply matches spec continuation today; a canvas that accumulates several replies may want a merged session. Decide in phase 2 with the dashboard in front of us.
- Do host components (phase 4) get `bindings` and `emit` like built-ins, or props only? Start with props only; add bindings when a scenario needs an input-type host component.
