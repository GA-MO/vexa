# Admin control: drive any React admin from the chat without per-feature tools

Status: **In progress** · Revision 1 · 2026-09-20 · phases 0–11 done (phase 8, 2026-09-21: `confirm: "page"` is the default, the app's own dialog is the approval; phase 9: passive cache on by default; phase 10: an optional `vexa-pages.json` a dev server can write; phase 11, 2026-09-21: discovery is automatic in a hidden same-origin frame, stored per user, and the model can ask for it with `admin_discover`); §9 items open (dev panel, `data-vexa-*` overrides, Playwright adapter). `bun run test` covers snapshot, resolver, cache, discovery, the frame host, the store, executor, admin tools, provider, prompt, handler, trace rendering and the shop-admin pages; `bun run test:scenarios` runs the thirteen `admin-*` scenarios on the real pages in happy-dom. Read `docs/host-integration-spec.md` first; this plan amends its §6 threat model (see §6 here).

Today a host that wants "mark order C-1042 as shipped" writes a host tool for it (`examples/shop-admin/lib/shop/host-tools.ts`). That is right for the five or ten operations an app cares most about, and wrong as the only path: an admin with forty screens would need hundreds of tools, and an app that adopts Vexa late will not write them. This plan adds a second path that needs no per-feature code and no markup changes: the chat observes the page through the **accessibility tree**, the model sends a short **plan of generic steps** (navigate, click, fill, select, submit, read), and a deterministic executor in the browser runs the steps against the real DOM and reports a compact trace.

The original brief (an "Admin Discovery" crawl that produces a semantic "Admin Map" with hand-named ids like `posts.create`) was reviewed against the code on 2026-09-20 and reshaped. The decisions and why are in §1. Everything else follows from them.

## 1. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **The accessibility tree is the primary mechanism, not `data-vexa-*` attributes.** Elements are addressed by `role` + accessible `name` (+ `within` for scoping), exactly like Playwright `getByRole`. | The host must not have to annotate every control; that is the same cost as writing tools. `examples/shop-admin` already exposes everything needed with zero Vexa markup: `<label>` around `<select>`, `role="group" aria-label`, `aria-pressed`, `<th>`, `<a href>`, `<tr aria-selected>`. Where the tree is silent (icon button without `aria-label`, `<div onClick>`) the fix is an accessibility fix the app needs anyway; Vexa reports it, it does not paper over it. |
| D2 | **No upfront discovery crawl, no hand-named semantic ids.** The chat observes the *current* page on demand; a route index comes from the links it has seen. A "map" is a cache of observations, built lazily, optional. | A crawl inside a SPA is intrusive (the user watches the app flick through routes), cannot reach dialogs without clicking (which discovery must not do), cannot enumerate dynamic routes, and Next.js App Router has no client-side route manifest. Ids like `posts.create` cannot be inferred with confidence; `{ role: "button", name: "Create product" }` can, and it is what the model already sees. |
| D3 | **The planner is a tool schema, not a layer.** One host tool `admin_run({ steps })` whose input is a discriminated union of steps. The model calls it once; the browser executes the batch; the result is a trace plus a fresh page snapshot. | This is the existing `defineTool` → `onToolCall` → `addToolOutput` loop (`src/chat/vexa-chat.tsx:212`). A separate `generateObject` planner would be a second model path outside `createVexaHandler`, which the repo forbids. One tool call per multi-step plan also gives the token and latency profile the brief asks for (§47/§48 there). |
| D4 | **Opt-in on both sides.** `<VexaProvider admin>` registers the tools in the browser; `createVexaHandler({ admin: true })` adds the prompt section and the tier on the server. | Prompt text and tiers are server config ("Where config lives" in CLAUDE.md). `hostTools[].description` is capped at 300 characters and `context` at 4 KB, so the vocabulary cannot travel from the client. The `admin_` name prefix is reserved by the library on both sides, so the server can trust the names without trusting the client. |
| D5 | **`admin_run` is a write-tier host tool that refuses `source: "button"`; the app's own confirmation dialog is the approval by default (`confirm: "page"`, 2026-09-21), a Vexa card only under `confirm: "mutating"`.** | The spec's T5 says host tools must not mutate; `admin_run` submits forms. Keeping T1 (spec buttons may call any host tool without the model) would let an injected spec submit a form silently. See §6. |
| D6 | **Deterministic executor, bounded, no retries without new information.** Errors are codes, not prose. Self-healing is the resolver's normal behaviour (resolve by role/name), not a feature. | A failed step ends the batch; the model gets the trace and the snapshot and decides. Never loop on the same target. |
| D7 | **First slice runs on `examples/shop-admin` unchanged.** `/settings` (native selects, aria-pressed group, labels) and `/orders` (table, links, filter) prove the executor before any new page is written. Products CRUD pages come after, for create/edit/delete scenarios. | The unknown is whether React inputs and the table can be driven from a host tool, not the shape of a schema. Prove that first. |
| D8 | **Discovery is automatic, invisible and per user; the pages file is optional (2026-09-21).** After load the provider walks the app's links in a hidden same-origin iframe, keeps the result in the browser for a day (per tab, or per signed-in user under `scope`), and the model may call `admin_discover` when it does not know where something is. | A developer-run job (phase 10) is forgotten and reflects the developer's permissions; the user's own session in a hidden frame sees exactly what that user may reach, costs one GET per page once a day, and never moves their tab. D2's objection to a crawl was the flicker in the user's tab, which the frame removes; its other objections stand (links only, no dialogs), and the passive cache and live observation still win over anything discovered. |

Deferred, in this order, only when the slice above works: observation cache keyed by route (§9), an optional "Discover" pre-warm that follows nav links, a dev panel, `data-vexa-*` overrides for the cases D1 cannot cover, export/import, MutationObserver invalidation, a Playwright adapter for CI.

## 2. The three pieces

```
                     model turn
                         │
   ┌─────────────────────┼─────────────────────────┐
   │ host tools (browser, existing loop)           │
   │                                               │
   │  admin_observe()  ──► snapshot of the page    │  read tier
   │  admin_run(steps) ──► executor ──► trace +    │  write tier, stops when the app
   │                                    snapshot   │  opens its own confirmation
   └───────────────────────────────────────────────┘
                         │
              src/admin/snapshot.ts    a11y tree → compact list with short refs
              src/admin/resolve.ts     target (ref | role+name+within) → Element
              src/admin/actions.ts     one function per step kind, drives React-controlled inputs
              src/admin/run.ts         validates the plan, runs steps, stops on error, builds the trace
              src/admin/tools.ts       defineTool() for admin_observe / admin_run, confirm policy
```

Server side, `createVexaHandler({ admin: true })` does three things in `src/core/chat.ts` and `src/core/prompt.ts`: `tierOf()` returns `write` for `admin_run` (so the Approval section names it and the guard downgrade drops it), the prompt gets an "## Driving the page" section (§7), and the default `stopWhen` rises from `stepCountIs(4)` to `stepCountIs(6)` when admin is on (observe → run → run again after a failure → final text).

## 3. Observation: what the model sees

`admin_observe()` and the `page` field of every `admin_run` result return the same snapshot:

```json
{
  "path": "/settings",
  "title": "Settings",
  "elements": [
    { "ref": "l1", "role": "link", "name": "Orders", "href": "/orders" },
    { "ref": "g2", "role": "group", "name": "Theme" },
    { "ref": "b3", "role": "button", "name": "Light", "pressed": true, "within": "g2" },
    { "ref": "b4", "role": "button", "name": "Dark", "pressed": false, "within": "g2" },
    { "ref": "s5", "role": "combobox", "name": "Locale", "value": "en-US", "options": ["en-US", "de-DE"] },
    { "ref": "t6", "role": "table", "name": "Orders", "columns": ["Order", "Customer", "City", "Status", "Total"], "rows": 12 }
  ],
  "unnamed": 2
}
```

Rules, all enforced in `src/admin/snapshot.ts` and unit-tested:

- Walk the DOM in document order; keep only interactive or structural roles: `link button textbox combobox listbox option checkbox radio switch slider spinbutton searchbox tab tablist group form table dialog alertdialog heading` (headings and groups only as scoping anchors for `within`).
- Accessible name per the accname algorithm, simplified: `aria-labelledby` → `aria-label` → associated `<label>` (`for` or wrapping) → text content of the element (buttons, links, options) → `placeholder` → `title`. An element with an empty name is not listed, only counted in `unnamed`, so the developer sees the gap.
- Hidden elements are skipped: `hidden`, `aria-hidden="true"`, `display: none`, `visibility: hidden`, and everything inside a closed `<details>` or an inert subtree. Devtools wrappers (`display: contents`) are transparent.
- Refs are `<letter><n>` per snapshot (`b3`, `s5`), generated in order, held in a `Map<ref, WeakRef<Element>>` on the provider. A ref from an earlier snapshot that no longer resolves to a connected element is an error `TARGET_STALE`, never a guess.
- Values: `value` for textbox / combobox / spinbutton, `checked` for checkbox / radio / switch, `pressed` / `expanded` / `selected` states when present. Truncate every string to 80 characters. **Never** the value of `type="password"`, `type="hidden"`, `autocomplete` credential fields, or anything with `data-sensitive`; those appear as `{ "role": "textbox", "name": "Password", "sensitive": true }`.
- Tables are summarised (columns from `<th>`, row count); rows come only from a `read` step, capped at 50 rows and 12 columns, with cell text truncated.
- Cap the list at 120 elements; when truncated, `truncated: true` and the model is told to scope with `within`. `dialog` / `alertdialog` subtrees are listed first when open, because the rest of the page is usually inert then.
- Output is JSON with only non-empty fields, no whitespace. A page like `/settings` is ~600 tokens; `/orders` with 12 rows summarised is under 1 000.

## 4. Targets and steps

```ts
type Target =
  | string                                            // a ref from the latest snapshot
  | { role: string; name: string; within?: string | { role; name; nth? }; nth?: number };  // name: exact, case-insensitive; "/re/" for a regex; within is one level deep

type Step =
  | { action: "navigate"; to: string }                // a path or the name of a link
  | { action: "click"; target: Target }
  | { action: "fill"; target: Target; value: string }
  | { action: "select"; target: Target; value: string } // option by label or value
  | { action: "check"; target: Target; checked: boolean }
  | { action: "submit"; target: Target }               // a form, or its submit button
  | { action: "read"; target: Target }                 // table rows or a field value → data
  | { action: "wait"; for: "navigation" | "idle" };    // navigation: path changed; idle: no DOM mutation for 300 ms, max 5 s
```

What the model receives is flatter than the union above: one step object `{ action, target?, value?, to?, checked?, for? }` with `action` an enum and every other field optional, and `within` limited to a ref or one `{ role, name, nth? }` object. `z.toJSONSchema` of a discriminated union emits `oneOf` over eight objects plus a recursive `$ref`, and `google/gemini-3.1-flash-lite` answered that with `{"steps":["click b4","select s5 de-DE"]}`. `planInputSchema` (flat, what `adminToolDescriptors()` publishes) and `planSchema` (`superRefine` for the fields each action needs, `transform` into the `Step` union) live in `src/admin/schema.ts`; `schema.test.ts` asserts the JSON schema has no `$ref`, `$defs` or `oneOf`. `admin_run` declares its input as `jsonSchema(planJsonSchema)` with no validator so the provider passes raw input through and `runPlan` answers a malformed plan with `PLAN_INVALID` and a detail such as `steps.0: must be an object like {"action":"click","target":"b4"}, not a string` (`describePlanIssue`) instead of a generic "Invalid input".

Refs only address the page the model has seen; steps that run after a `navigate` must use role + name targets. The executor inserts an implicit `wait: navigation` after `navigate` and an implicit `wait: idle` after `submit` and after any `click` that opened a dialog, so plans stay short.

`resolve(target)` in `src/admin/resolve.ts`: a ref looks up the WeakRef; a role/name target queries the current tree with the same accname rules as the snapshot, scoped to `within` when given. Zero matches → `TARGET_NOT_FOUND`, more than one and no `nth` → `TARGET_AMBIGUOUS` with the candidates listed (`{ ref, name, within }` for each, max 5) so the model can pick one without re-observing. A disabled or `aria-disabled` element → `ELEMENT_NOT_INTERACTABLE`.

Result of `admin_run`:

```json
{
  "ok": false,
  "trace": [
    { "action": "navigate", "to": "/orders", "ok": true, "ms": 210 },
    { "action": "fill", "target": { "role": "searchbox", "name": "Search" }, "ok": true },
    { "action": "click", "target": { "role": "button", "name": "Edit" }, "ok": false, "error": "TARGET_AMBIGUOUS",
      "candidates": [{ "ref": "b14", "within": "row C-1042" }, { "ref": "b19", "within": "row C-1043" }] }
  ],
  "page": { "...": "snapshot after the last step" }
}
```

Error codes, exported from `src/admin/errors.ts`: `TARGET_NOT_FOUND TARGET_AMBIGUOUS TARGET_STALE ELEMENT_NOT_INTERACTABLE ROUTE_NOT_FOUND NAVIGATION_TIMEOUT SUBMIT_FAILED FORM_INVALID DECLINED ACTION_NOT_ALLOWED PLAN_INVALID`. `FORM_INVALID` means `form.checkValidity()` failed, with the first invalid field's name. `SUBMIT_FAILED` means the form is still present and unchanged after the idle wait, or the page shows a `role="alert"` that appeared after submit (its text is included).

## 5. Driving React from the outside

This is the technical risk and the reason phase 0 is a spike. Known requirements, to be verified on `/settings`:

- **Text inputs.** Setting `input.value` does not reach React. Use the prototype setter (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, value)`) then dispatch `input` and `change` with `bubbles: true`. Same for `HTMLTextAreaElement`. Focus before, blur after, so `onBlur` validation runs.
- **Native `<select>`.** Prototype setter on `value` (matching by option value, then by option label), then `change`.
- **Checkbox / radio.** `el.click()` when the desired state differs from the current one; never set `checked` directly.
- **Custom comboboxes** (`@base-ui/react` Select and the like): `role="combobox"` with `aria-haspopup` / `aria-controls`. `select` clicks the trigger, waits for the `listbox`, clicks the `option` whose name matches, waits for the listbox to close. If no listbox appears within 1 s → `ELEMENT_NOT_INTERACTABLE` with `reason: "no listbox"`.
- **Submit.** `form.requestSubmit(button?)` when the target resolves to a form or to a button inside one; a plain `click()` otherwise. Never `form.submit()` (skips validation and React handlers).
- **Navigate.** Prefer clicking a link whose `href` equals the path (router-agnostic, keeps SPA state). When no such link is on the page and `admin.navigate` is configured, call it (the host passes `router.push`; one function, not per-element markup). Otherwise `location.assign(path)`, which is a full load, and say so in the trace (`mode: "reload"`). A path not matching any known link and no `admin.navigate` → `ROUTE_NOT_FOUND`.
- **Idle wait.** One `MutationObserver` on `document.body` started per step and disconnected after; resolves when 300 ms pass with no mutation, rejects at 5 s. This is the only observer; there is no permanent DOM watcher.

Everything above is plain DOM; nothing reads React internals or fibers.

## 6. Security model (amends `host-integration-spec.md` §6)

The spec's T1 and T5 rest on "host tools are read-tier and never mutate". `admin_run` breaks that on purpose, so the rules change as follows:

| | Before | After |
|---|---|---|
| T5 | Host tools must not mutate data | Host tools defined by the host must not mutate data. `admin_run` may. Under the default `confirm: "page"` (2026-09-21) nothing asks first: the executor runs every step, and when a `click` or `submit` opens the app's own confirmation dialog (`alertdialog`, or a `dialog` with no inputs and at most four buttons, `src/admin/dialogs.ts`) the run stops with `ok: true`, `stopped: "confirmation"`, `remaining`, and every later step inside that dialog is refused with `ACTION_NOT_ALLOWED`, so a human presses the final button in the real UI. Under `confirm: "mutating"` the executor instead pauses before the first *mutating* step and asks through the existing `requestConfirmation` (`src/react/host.tsx`), showing the remaining steps in plain words; Reject → `DECLINED`, steps already run stay, nothing was committed; after approval the model may drive the app's dialog. |
| T1 | A spec button may call any host tool | A spec button may call any host tool except `admin_run`, which returns `ACTION_NOT_ALLOWED` for `source: "button"`. `admin_observe` is allowed from buttons. |
| tier | Host tools are always read | `tierOf()` returns `write` for the reserved name `admin_run` when `admin: true`; the server ignores `admin_*` host tool schemas entirely when `admin` is off. |
| names | any `^[a-z][a-z0-9_]{0,63}$` | `assertToolNames` rejects host-defined tools starting with `admin_`. The provider adds them itself. |

What counts as mutating under `"mutating"` is: every `submit`; every `click` whose resolved element is inside a `dialog` / `alertdialog`, or whose name matches `DESTRUCTIVE_NAMES` (`/^(delete|remove|archive|unpublish|publish|discard|revoke|reset)\b/i`), or that is a `<button type="submit">`. `fill`, `select`, `check` are not mutating: they change the form, not the record. A host that wants every step confirmed sets `admin: { confirm: "all" }`; a host that wants none (a sandbox) sets `"none"`. `operationalRules()` keeps `admin_run` out of the named approval-card list (the tier still drives the guard), and the "Driving the page" section carries the `stopped: "confirmation"` rule and, for `"mutating"`, the announce-then-call and never-retry-after-DECLINED rules.

Unchanged and still load-bearing: the backend authorises every request the page makes; the guard downgrade drops `admin_run` on a flagged tool result because it is write tier; the body stays `.strict()`; the model never receives a value of a sensitive field; no step evaluates a string as code.

## 7. Prompt section (server, only with `admin: true`)

Appended after `operationalRules` and before host `instructions`, so the invariants still come last:

```
## Driving the page
- admin_observe returns what is on the current page: elements with a ref, role and name. Call it first when you need to act on the page and have no fresh snapshot.
- admin_run runs a list of steps in order and stops at the first failure. Put every step of one task in one call: navigate, click, fill, select, check, submit, read. Use refs for the page you have seen; after a navigate, address elements by role and name.
- Prefer a dedicated host tool when one fits the request; use admin_run for everything else.
- Forms and buttons run without asking. When a click opens the app's own confirmation dialog, the run stops with stopped: "confirmation": tell the user in one sentence what the dialog will do and that they decide in it; never try to press its buttons. If the host shows a Vexa confirmation instead (confirm policy mutating), write one sentence about the change and call admin_run in the same turn; if that trace ends with DECLINED, nothing was committed; stop.
- On TARGET_AMBIGUOUS pick one of the listed candidates. On TARGET_NOT_FOUND read the returned page; do not retry the same target.
- Report only what the trace proves. "ok": true on a submit step and the page no longer showing the form is the only evidence a change happened.
```

## 8. Layout

```
src/admin/
  index.ts        the vexa/admin entry: types, error codes, ADMIN_TOOL_NAMES
  snapshot.ts     snapshot(root): Snapshot; accessibleName(el); role(el)
  resolve.ts      createResolver(): { refs, resolve(target), remember(snapshot) }
  actions.ts      fill / select / check / click / submit / read / navigate / waitFor
  run.ts          runPlan(steps, deps): validates with zod, executes, builds the trace
  tools.ts        adminTools(options): { admin_observe, admin_run } as HostTool records
  errors.ts       codes and the AdminError shape
  schema.ts       zod for Target, Step, Plan (also used to build the JSON schema the client sends)
src/react/host.tsx      `admin` prop → merges adminTools() into `tools` before toolSchemas(); rejects host tools named admin_*
src/core/chat.ts        admin tier + stopWhen default
src/core/prompt.ts      ADMIN_RULES
src/core/handler.ts     `admin?: boolean | { stopWhen? }` on VexaHandlerConfig; drops admin_* schemas when off
src/chat/messages.tsx   renders an admin_run part as a step list (✓ / ✗ per step) instead of raw JSON; the confirmation card lists the pending steps
```

`vexa/admin` needs an `exports` entry and tsconfig `paths` in every example and the website (only `src/` ships).

zod is allowed here because the plan schema is library-owned like the catalog; hosts never see it. The client sends `z.toJSONSchema(planSchema)` as the host tool `inputSchema` (the server already accepts arbitrary JSON schema for host tools).

## 9. Later (after phase 7)

The observation cache, `admin_observe({ path })` and host-triggered discovery are done (phase 7); the passive cache and export/import are done (phase 9); the optional pages file a dev server writes is done (phase 10); automatic discovery in a hidden frame, per-user storage and `admin_discover` are done (phase 11). Still open, each as its own small plan when a host asks: a dev panel that shows `routes`, `observed` and the last trace; `data-vexa-*` overrides for the cases D1 cannot cover; a Playwright adapter for apps whose pages cannot be mounted in happy-dom.

## 10. Phases

Each phase ends with `bun run typecheck` and the check listed. Mark the box and note the date when done so the next session starts from the right place.

### Phase 0 — spike (half a session)
- [x] `src/admin/snapshot.ts` and `src/admin/actions.ts` in their first form, no schema yet (2026-09-20)
- [x] Verified with a happy-dom test instead of a throwaway button: `examples/shop-admin/lib/admin-spike.test.tsx` renders the real `SettingsPage` and `OrdersPage` inside `ShopProvider` with `createRoot` + `act` (2026-09-20)
- [x] Proved: the React store updated after `select` (`de-DE` read back through a `useShop()` probe), `aria-pressed` moved after `click`, every control on `/settings` has a name, `unnamed` is 0 (2026-09-20)
- [x] On `/orders`: `fill` on the search box filters the table to one row through React state, the table is summarised with its six columns and 24 rows, the link in row C-1042 is addressable by role + name and scoped `within` the table, `readTable` returns the rows; a status-filter `click` re-renders the list (2026-09-20)
- [ ] Clicking the row link and confirming `/orders/C-1042` rendered: not possible without a router; `next/link` renders a plain `<a>` in the test. Navigation is verified in phase 4 against the app
Check: `bun test examples/shop-admin/lib/admin-spike.test.tsx` → 7 pass, 0 fail.

#### Spike result (2026-09-20)

Test infrastructure: `happy-dom` + `@happy-dom/global-registrator` + `@types/bun` as root devDependencies; `bunfig.toml` preloads `scripts/test-dom.ts`, which registers the DOM globals with `url: http://localhost:3001/` and sets `IS_REACT_ACT_ENVIRONMENT`. Tests run from the repo root (`bun test <path>`); the shop-admin test lives next to the page it renders because `@/` resolves through that tsconfig, and `examples/shop-admin/tsconfig.json` includes `@types/bun` so `bun:test` typechecks.

What worked without touching any page:

- Native `<select>` inside a wrapping `<label>`: prototype value setter + `input` + `change` reaches React's `onChange`; the store changed.
- `<button aria-pressed>` in a `role="group" aria-label`: `click()` reaches `onClick`; the pressed state moved to the other button.
- React-controlled `<input type="search" aria-label>`: `fill` reaches `onChange`; the table re-rendered with one row.
- Table summary from `<th>` and `tbody tr` with `<td>`; links inside rows carry `within: <table ref>`.
- Refs survive a keyed re-render: after the status filter click, the `<a>` of an order that stayed visible is still connected, the `<a>` of an order that left is not. So `TARGET_STALE` will fire only when the element really left the page.

Snapshot sizes (JSON, no whitespace): `/settings` 739 characters (10 elements), `/orders` 2 779 characters (24 row links + heading, group, six filter buttons, searchbox, table). Both well under the 120-element cap.

Where reality differed from §3 and §5:

- happy-dom has no `HTMLOptionElement.label`, so labels fall back to `textContent` then `value` (`optionLabel()` in `snapshot.ts`, shared with `actions.ts`). Browsers have `label`; the fallback is harmless there.
- `HTMLSelectElement.selectedOptions` was stale in happy-dom after React updated the select; the snapshot reads `select.value` and finds the option by value instead. Same result in browsers.
- The accessible-name walk must exclude only *descendant* form controls of a label, not the element itself; the first version returned an empty name for every `<button>`.
- Structural roles (`form`, `table`, `group`, `dialog`) are listed even without a name so they can scope `within`; only interactive roles count toward `unnamed`. `<input type="hidden">` is not listed at all rather than listed as sensitive.
- `next/link` renders a plain `<a href>` outside the App Router, so `navigate` by link click cannot be proven in happy-dom. Phase 4 covers it in the browser.
- The custom combobox path (`@base-ui/react` Select) is a `NOT_SUPPORTED` stub; nothing in the current shop-admin uses one. Phase 5 adds one on the product form to exercise it.

### Phase 1 — snapshot and resolver
- [x] `snapshot.ts` per §3 with every rule; `resolve.ts` per §4; `errors.ts` (2026-09-20)
- [x] `bun test` set up for `src/admin/**/*.test.ts` with `happy-dom` (devDependency; `bunfig.toml` preload registers the DOM); this is the repo's first unit test suite; `bun run test` (2026-09-20)
- [x] Tests: accessible name precedence, hidden elements skipped, sensitive values withheld, table summary, cap and `truncated`, ref stale after removal, ambiguity with candidates, `within` scoping, `nth` (2026-09-20, `src/admin/snapshot.test.ts` 21 tests, `src/admin/resolve.test.ts` 15 tests)
Check: `bun test src/admin`.

Phase 1 adjustments to §3 and §4, now the implemented behaviour:
- A table with more than 5 body rows is summarised only; its descendants are not listed (the /orders snapshot fell from 2 779 to 766 characters). Elements inside such a table are addressed through `within: { role: "row", name: "/C-1042/" }` or `within: "<table ref>"`; the resolver knows `tr` → `row` and `td`/`th` → `cell` as scopes only, a row's name is its cell texts joined by spaces. A table with 5 rows or fewer lists its interactive descendants, since small tables are usually action lists.
- Unnamed structural elements (`table`, `group`, `form`, `dialog`) are listed without a `name` key so they can scope `within`; only interactive roles count in `unnamed`.
- Refs are dense (`b1`, `l2`, …) and held in a plain `Map` on the resolver, replaced by every `remember()`; a `WeakRef` buys nothing while the previous snapshot is dropped anyway.
- `checkVisibility()` is used when the browser has it; `getComputedStyle` is the fallback.

### Phase 2 — executor
- [x] `schema.ts` (Target, Step, Plan; max 20 steps), `run.ts`, `wait.ts`, `actions.ts` per §5 with implicit waits (2026-09-20)
- [x] Trace shape per §4; stops at first failure; `FORM_INVALID`, `SUBMIT_FAILED`, `NAVIGATION_TIMEOUT` (2026-09-20)
- [x] Tests with happy-dom for fill / select (native) / check / click / submit (`requestSubmit`, validity), `PLAN_INVALID`, `DECLINED`, confirm-once, ambiguity candidates, read, navigate by link / host router / reload / `ROUTE_NOT_FOUND` / timeout, `SUBMIT_FAILED`, `waitForIdle` (2026-09-20, `src/admin/run.test.ts` 22 tests). Custom combobox and real-router navigation are tested in phase 5 against the real app
Check: `bun test src/admin`.

Phase 2 adjustments, now the implemented behaviour:
- `runPlan(input, deps)` takes every browser-facing dependency injected (`root`, `resolver`, `navigate`, `confirm`, `isMutating`, `page`, `now`, `wait`), so phase 3 wires the provider and tests run without a browser.
- `waitForIdle` never fails: when the page keeps mutating for the whole timeout it returns `settled: false` and execution continues (a page with a live clock or spinner must not block a plan). Only `waitForNavigation` produces `NAVIGATION_TIMEOUT`.
- `PLAN_INVALID` is reported as a trace item with `action: "plan"` and the zod issue path (`steps.0.value: …`).
- `SUBMIT_FAILED` requires both: the form still connected after the idle wait and a `role="alert"` that was not there before the submit. A form that disappears is a success even when an alert (a toast) appears elsewhere.
- `read` on a disabled field is `ELEMENT_NOT_INTERACTABLE` because every target goes through the same interactability check; revisit if reading disabled values turns out to matter.

### Phase 3 — provider and server opt-in
- [x] 2026-09-20 `host.tsx`: `admin?: boolean | AdminOptions` (`confirm`, `navigate`); `adminTools()` merged into `tools`; reserved-name assertion; `admin_run` refuses `source: "button"`; confirmation description lists the pending steps
- [x] 2026-09-20 `chat.ts` / `prompt.ts` / `handler.ts` per §2 and §7; `admin_*` schemas dropped when `admin` is off
- [x] 2026-09-20 `messages.tsx`: step list rendering for `admin_run` parts; `labels.runOnPage` gets a sibling `runSteps(count)` label
- [x] 2026-09-20 `docs/host-integration-spec.md` §6 amended per §6 here; the PR checklist gains "`admin_run` is the only mutating host tool and is write tier"
Check: `/tests/chat-elements` gains an `admin_run` part at 340px and 600px; `curl -s http://localhost:3001/tests/chat-elements | grep -c admin_run`.

Phase 3 notes (2026-09-20): the curl counts 2 (the collapsed tool header); collapsed `ToolContent` is not server-rendered for any tool, so the rows are proved by `src/chat/admin-trace.test.tsx`, which renders the `admin-run` chat-elements example in happy-dom, expands it and reads the sentences and the error. The admin tools live in `src/admin/tools.ts` with their own structural `AdminHostTool` type (host.tsx imports tools.ts, so tools.ts cannot import `HostTool`). `HostToolResult`'s failure variant gained optional `data` so a failed `admin_run` still carries the trace and page. `ConfirmationSummary` (exported from `vexa/react`) renders either the classic `runOnPage` + description or `runSteps(n)` + the step list; both the tray and the chat card use it. `vexa/chat` now imports `vexa/admin`, so every alias map (six tsconfigs, three vite configs) lists it. `tierOf` and `dropAdminHostTools` are exported for tests. `useAdminTools` memoizes on `enabled`, `confirm` and `navigate` (not the options object) so an inline `admin={{ … }}` does not loop the schema effect.

### Phase 4 — shop-admin without new pages
- [x] `examples/shop-admin`: `admin={{ navigate: router.push }}` on `DemoHost` (memoized on `router`), `admin: true` in `lib/shop/chat-handler.ts`, which both the API route and the static mock build go through (2026-09-20)
- [x] Scenarios `admin-observe`, `admin-settings`, `admin-find-order`, `admin-not-found`, `admin-ambiguous` in `examples/shop-admin/lib/test-plans/`, each with a real-model script and a mock script; guide group "Drive the page without writing tools" in `guide-groups.ts`; best-practice entries in `docs/control-best-practices.md` (2026-09-20)
- [x] Runner: a scenario with `domPage: true` gets the real shop-admin page for `scenario.page` mounted in happy-dom (`examples/shop-admin/lib/scenarios/dom-host.tsx`: `ShopProvider` + the route's page component, `PathParamsContext` for `/orders/[id]`, one click listener that turns `a[href^="/"]` into an in-app navigation, `createAdminTools` from `vexa/admin` over that container), so `bun run test:scenarios` executes the real `admin_observe` / `admin_run` without a browser and the page changes after every step. `bun --preload ./lib/scenarios/register-dom.ts` (in the `test:scenarios` script) registers happy-dom before `react-dom` is evaluated, which is required: `react-dom` reads `canUseDOM` once at load and never delivers `onChange` otherwise. `scripts/dom.ts` (`registerDom`) keeps Bun's native `fetch` / `Response` / stream classes so the runner still streams from the dev server; `bun test` preloads the same function with `IS_REACT_ACT_ENVIRONMENT` on. `adminToolDescriptors()` (exported from `vexa/admin`) is the one source of the two descriptors for scenarios (2026-09-20)
Check: `VEXA_SCENARIO_MODEL=mock bun run test:scenarios admin-observe admin-settings admin-find-order admin-not-found admin-ambiguous` → 5/5; the same five against `google/gemini-3.1-flash-lite` → 5/5 on the real DOM (2026-09-20, after the schema flattening and the runner DOM below); the full suite with the mock → 32/32; `curl -s http://localhost:3001/guides | grep -c "Drive the page"` → 1; `curl -s http://localhost:3001/guides/admin-settings | grep -c admin_run` → 2.

Phase 4 notes:
- Admin tools have no app source to slice, so `tool-sources.ts` shows the `const admin = …` line and the `<VexaProvider …>` tag from `demo-host.tsx` plus the `admin: true` line from `chat-handler.ts` for any `admin_*` tool.
- `docs: "host/admin"` on the five scenarios points at the phase 6 page; the link 404s until then.
- The resolver needed no change for an unnamed table: `name: "/.*/"` is a regex and matches the empty name, so `within: { role: "table", name: "/.*/" }` scopes to the only table on `/orders`.
- The shop-admin `rules` still tell the model to prefer `set_locale` / `set_theme` for settings; the `admin-settings` prompt says "using the controls on the page" to make the real model take the `admin_run` path, and the real run confirmed it does.
- First real-model run (2026-09-20) found three things the mock could not: (1) the step schema was unusable for a small model (see §4: flattened, no `oneOf` / `$ref`; the prompt bullet now carries a literal example step and "never a string"); (2) a model that observes first, sees no Export button and says so is correct, so scenario steps gained `expectToolsAnyOf: string[][]` (runner + `describe.ts`) and `admin-not-found` accepts `admin_observe` alone; (3) "Open the order" sent the model to `get_orders`, so `admin-ambiguous` asks to "click the order link in the table on this page".
- The second real-model run, on the real DOM, found two more: (4) after a `fill` the model saw the table summary but no row to click, split the task and looked the row up through `get_orders`; the prompt now says how to address a row inside a table (`within: <table ref>, nth: 0`, or a `read` step) and `admin-find-order` asks to "type … into the search box, then click the first order link in the table"; (5) an executor bug: `fill` → `click` in one plan clicked the row of the *unfiltered* table because React had not re-rendered between the two steps (the browser guide only passed thanks to a `read` step in between). `run.ts` now yields a macrotask after every `click` / `fill` / `select` / `check` so the page has rendered before the next step resolves its target.
- `admin-find-order` and `admin-ambiguous` also accept `get_orders` next to `admin_run` in `expectToolsAnyOf`, since a model may look a row up before clicking; `admin_run` must still appear.
- A `reject: "admin_run"` script step makes the DOM host's confirm answer false for the whole scenario (decided at session start, because the runner awaits the tool inside the turn), and the step then applies its expectations to the turn that produced `DECLINED`; nothing uses it yet, phase 5's delete scenario will.

Prompt rewrite (2026-09-20, reviewed): `admin-settings` is now "Switch the steps display setting to hidden" (the earlier "Hide the thinking steps in the chat" read as an instruction about the assistant's own replies) and `admin-not-found` moved to `/products` ("Export the products to CSV") because on `/orders` the model reasonably reached for `get_orders`.  the user found the guide prompts unnatural (they steered a small model away from the dedicated host tools: "using the controls on the page, not the settings tools", "type … into the search box"). Every admin scenario now uses a plain request on a task that has no dedicated host tool, and no prompt names a tool or a control: `admin-settings` → "Hide the thinking steps in the chat" (Steps display has no tool), `admin-find-order` → `admin-find-product` "Find the gooseneck kettle and open it", `admin-not-found` → "Export the orders" on `/orders`, `admin-ambiguous` → "Open the kettle" (a second product `Electric kettle` was added to `PRODUCTS`), `admin-create-product` → "Add a new product: …", `admin-edit-product` → "Change the gooseneck kettle price to $89", `admin-delete-*` → "Delete the gooseneck kettle" from `/products`, `admin-cross-page` → "Add a product called …", `admin-not-observed` → "What's on the products page?"; `admin-stale` is `kind: "check"` (off the guide index, still in the runner). Two library changes came out of the real-model run: (1) the resolver matches a query for a structural role (`table`, `group`, `form`, `dialog`) to the only unnamed element of that role when no name matches, because the model addressed the unnamed products table as `{ role: "table", name: "Products" }` from the heading (`src/admin/resolve.ts`, tested); (2) `ADMIN_RULES` says a request about how the chat or admin looks means its settings page, not the assistant's own replies. Result with `google/gemini-3.1-flash-lite`: 11/12; `admin-settings` still fails with the natural prompt: the model answers "I will not display my internal steps" without any tool call, reading the request as an instruction to itself (the mock path on the guide page works). Left as a known limitation of small models; `VEXA_SCENARIO_DEBUG=1` now prints every host tool input and output in the runner. Review of the real-model traces also added a resolver rule: a query whose `name` is a remembered ref of the same role (`within: { role: "alertdialog", name: "d1" }`) resolves to that ref, because small models put refs in the name slot. Small models also tend to send one step per `admin_run` (read → click → click) instead of one batched plan; correct but 3–5 calls for a mutating flow.

### Phase 5 — products CRUD in shop-admin
- [x] `lib/shop/data.ts` `PRODUCTS` (8, `P-1001`…), `CATEGORIES`, `PRODUCT_STATUSES`, `findProduct`, `nextProductId`, `filterProducts`; store `products` + `addProduct` / `updateProduct` / `deleteProduct` and a `lastProductNotice` the list page shows as `role="status"`; pages `/products` (search box "Search products", table with the name as the row link, "Create product" link), `/products/new` and `/products/[id]` (`components/shop/product-form.tsx`: labelled Name / SKU / Price, Category as a `@base-ui/react` Select whose trigger is named through `aria-labelledby`, Status as a native select; `product-detail-page.tsx` adds "Delete product" → base-ui `AlertDialog` titled "Delete <name>?" with Cancel / Delete). "Products" in the nav, `/products` in the `navigate` host tool enum, the three routes in `dom-host.tsx` (which now also provides `AppRouterContext` so `useRouter().push` works in happy-dom, and snapshots `document.body` so portalled popups are in scope) (2026-09-20)
- [x] Executor: `select` on a `role="combobox"` that is not a `<select>` clicks the trigger, waits up to 1 s for a visible `[role="listbox"]` (`aria-controls` first, then the document, because base-ui portals it), clicks the option whose accessible name matches, waits for the listbox to close or `aria-expanded="false"`; `OPTION_NOT_FOUND` lists the options, `ELEMENT_NOT_INTERACTABLE` / `no listbox` on timeout. `select` is async now. Unit-tested with a plain ARIA fixture (`src/admin/actions.test.ts`) and against the real base-ui Select through `examples/shop-admin/lib/admin-products.test.tsx` (create, edit, delete + declined, all on the real pages in happy-dom) (2026-09-20)
- [x] Scenarios `admin-create-product`, `admin-edit-product`, `admin-delete-product`, `admin-delete-declined` (split from delete because the runner pre-decides the `admin_run` confirm once per scenario), `admin-stale`; added to the guide group and `docs/control-best-practices.md` (2026-09-20)
- [x] No specific host tools for products: this is the point of the example
Check: mock 5/5, real model 5/5 (`admin-delete-declined` on attempt 2 of 2), whole suite with the mock 37/37; `curl -s http://localhost:3001/products | grep -c "Create product"` → 1, `/products/new` → 2.

Notes from phase 5:
- `google/gemini-3.1-flash-lite` twice announced "I am about to delete…" and ended the turn without calling `admin_run`. The "Driving the page" bullet now says the sentence and the call belong in the same turn and that a sentence alone does nothing; `admin-delete-declined` carries `attempts: 2` like `denial-semantics`, for the same reason.
- happy-dom reports `stepMismatch` for `89` against `step="0.01"` (float division), so the price field uses `step="any"`; browsers accept both.
- The base-ui Select opens on a plain `click()` (verified in Chrome on `/products/new`); no pointer events are needed. The listbox stays mounted after closing, so the executor treats `aria-expanded="false"` as closed.
- The Chrome check of the create guide could not be repeated at the end of the phase (the devtools session was no longer reachable); the runner and the happy-dom test cover the same path.

### Phase 6 — docs
- [x] `website/content/docs/host/admin.mdx` ("Drive the page", URL `host/admin` as the scenarios link it): what it is, enabling it on both sides, the real `/settings` snapshot and the rules that shape it, one step per action, targets and `within` / `nth`, the trace and every error code, confirmation policy, accessibility as the contract with the `unnamed` counter, security model, limits and troubleshooting by symptom, ten best-practice bullets with Try it links; listed in `meta.json` after runTool; `config-reference` route and provider files carry `admin` with a one-line note and the tables link the page (2026-09-20)
- [x] `docs/host-integration-spec.md` cross-link at §6; `README.md` feature bullet and `vexa/admin` entry-point row; `host-tools.mdx` points at the page; CLAUDE.md layout entry for `src/admin/` (2026-09-20)
Check: `bun run typecheck`, `bun run build:pages`.

Phase 6 notes: the docs site serves every page's `.md` twin from the mdx (`website/app/routes/docs.md.ts`), so no separate Markdown file is written.

### Phase 7 — cache, discover, routes (2026-09-20)
- [x] Safe refs: `resolve.ts` remembers `{ element, role, name }` per ref and returns `TARGET_STALE` with `ref b3 was "Delete" (button), now "Edit" (button)` when the element changed under the ref, so refs from a cached page cannot hit the wrong control
- [x] `src/admin/cache.ts`: `createObservationCache()` (pages by path, links seen, `routes()` with dedupe, `/api` exclusion, query/hash stripping, dynamic-sibling collapsing, cap 40, observed first, `subscribe`); `collectLinks(root)` feeds links inside summarised tables into the index
- [x] `admin_observe({ path? })`: live for the current page, cached (`cached: true`, `observedAt`) for a visited one, `PAGE_NOT_OBSERVED` + `routes` otherwise; every observe and run result carries `routes` and `observed`; a `navigate` trace item carries the arrived page
- [x] `src/admin/discover.ts`: `discoverPages()` BFS over `cache.routes()`, read-only, `limit` 25, `skip`, `onProgress`, per-route errors, returns to the start page
- [x] `useVexaAdmin()` on the provider (`discover`, `progress`, `routes`, `observed`, `clear`); the cache and resolver live in one `useRef` runtime; `DISABLED_ADMIN` outside a provider
- [x] Prompt: observe/routes/observed bullets and the cross-page rule; `src/core/prompt.test.ts`
- [x] Shop-admin: "Discover pages" button in the nav (skips `/guides`), scenarios `admin-cross-page` (`discover: true` runs discovery on the DOM host before the script) and `admin-not-observed`; the DOM host now mounts `TopNav` so every page has links
- [x] Docs: "Pages you are not on" and "Discover" sections, the error code, two best-practice bullets; README clause
Check: `bun run test` 133; mock suite 39/39; real model `admin-cross-page`, `admin-not-observed`, `admin-find-order`, `admin-stale`, `admin-create-product` all pass (the last two needed a wider text expectation and a second attempt respectively); in Chrome, "Discover pages" on `/settings` visited 7 pages in 3.2 s and returned, and a following "Create a product …" prompt with the real model produced one `admin_run` from `/settings`, one confirmation, and the product on `/products`.
Notes: a dynamic-route pattern needs three id-like siblings (a digit in the last segment) or six siblings of any kind, so `/products/new` stays a page while `/products/P-1001…` and `/guides/*` collapse; discovery samples one page per pattern. Cached refs are numbered in document order, so they usually still match after a navigate; when they do not, the safe-ref check turns the step into `TARGET_STALE` instead of a wrong click. The shop persona now names products and says they are driven through the page, because a real model on the plain `/settings` page once refused to create a product before that line existed.

### Phase 8 — the app's dialog is the approval (2026-09-21)
Product decision: most host apps will not write host tools and already confirm destructive actions with their own modal, so the assistant must press every button and Vexa must not add a second confirmation on top of the app's.
- [x] `src/admin/dialogs.ts`: `isConfirmationDialog` (an `alertdialog`, or a `dialog` / open `<dialog>` with no inputs and one to four buttons or links), `confirmationDialogsIn`, `insideConfirmationDialog`; `dialogs.test.ts` (9)
- [x] `run.ts`: `RunDeps.pageConfirms`; after a `click` or `submit` (once React has rendered) a new confirmation dialog marks the trace item `opened: "confirmation"`; under `pageConfirms` the run stops there with `ok: true`, `stopped: "confirmation"`, `remaining`, and any step whose target sits inside a confirmation dialog is `ACTION_NOT_ALLOWED` ("the page is asking the user to confirm; the user decides in the dialog"); `"mutating"` / `"all"` / `"none"` unchanged (`run.test.ts` +6)
- [x] `tools.ts`: `AdminConfirmPolicy` gains `"page"`, `DEFAULT_CONFIRM_POLICY = "page"` (exported), `runSummary` → `Stopped: the page is asking the user to confirm (N steps not run)`, `admin_run` description updated (`tools.test.ts` +3)
- [x] Prompt: the confirmation bullet rewritten (page dialog first, Vexa card only under `"mutating"`); `operationalRules()` no longer names `admin_run` in the approval-card list because the server cannot know the client policy (`prompt.test.ts`)
- [x] Chat: `AdminTrace` ends with a muted "Waiting for you to confirm on the page" row (`HandIcon`) when `stopped` is set
- [x] Shop-admin uses the default; the DOM host takes `confirmPolicy` and gained `pressButton(name)`; scenario type gained `confirmPolicy`, a `pageClick` step (the reader presses a button on the real page, kept out of the guide prompts) and `expectPage` (`dialogOpen`, `textPresent`, `textAbsent`, checked against the DOM host's document); `describe.ts` prose for both
- [x] Scenarios: `admin-delete-product` (dialog opens → run stops → `pageClick: "Delete"` → "Is it gone?" → model reads the page), `admin-delete-declined` (`pageClick: "Cancel"` → "Did it get deleted?" → still there), new `admin-mutating-policy` (`kind: "check"`, `confirmPolicy: "mutating"`, `reject: "admin_run"` → `DECLINED`); `admin-products.test.tsx` covers both policies on the real product page
- [x] Docs: `admin.mdx` Confirmation rewritten around the four policies with `page` first, security section, error table and troubleshooting rows, best-practice bullets; `host-integration-spec.md` T5 and checklist; `config-reference/provider.tsx`; `docs/control-best-practices.md`
Check: `bun run test` 158; mock suite 40/40; real model (`google/gemini-3.1-flash-lite`) `admin-delete-product`, `admin-delete-declined`, `admin-mutating-policy` (attempt 2), `admin-create-product`, `admin-edit-product`, `admin-cross-page` all PASS; the delete reply was "The "Delete product" confirmation dialog for the "Gooseneck kettle" is now open" and, after the user pressed Cancel, "No, the item has not been deleted".
Notes: found in Chrome on the way: a `click` on a link to another path did not wait for the navigation (Next.js navigates asynchronously; the runner's `flushSync` host hid it), so the next step resolved against the old page. `clickStep` now waits for the path change like `navigate` and the trace item carries the arrived `page` (`mode: "router"`); links to the current path or a hash do not wait (`run.test.ts` +2). The confirmation check runs after the executor's one-macrotask yield, because in happy-dom (and for portalled popups in general) the dialog is not in the DOM synchronously after `click()`. base-ui's `AlertDialog` (portalled, `role="alertdialog"`) is detected on the real product page. A dialog that has inputs (rename, move) is a form and the run continues through it; a dialog with five or more buttons is a menu, not a confirmation.

### Phase 9 — passive cache and page seed (2026-09-21)
Product question: when should discovery run in production? Answer: never for end users. Two cheaper mechanisms replace it.
- [x] `src/admin/passive.ts`: `watchPages(deps)` records the current page at once and again after the first idle, then every route change (MutationObserver on the root + `popstate`, debounced by the idle quiet window; only the cache is touched, never the resolver); returns a stop function (`passive.test.ts` 3). `AdminOptions.passive` (default true); the provider starts it in `useAdminRuntime` and stops it on unmount
- [x] `src/admin/seed.ts`: `AdminPages { version: 1, exportedAt, pages, links }`, `adminPagesSchema`, `exportPages(cache)`, `importPages(cache, data)` (validates, merges by path, an older seed never overrides a newer live entry); the cache gained `entries()`, `links()`, `restore(page, links)` (`seed.test.ts` 3). `AdminOptions.pages` seeds the cache when the runtime is created (invalid → `console.warn`, ignored); `useVexaAdmin()` gained `exportPages()` / `importPages()` (`host.test.tsx` +2)
- [x] `examples/shop-admin/scripts/discover-pages.ts` (`bun run --cwd examples/shop-admin discover`): mounts the pages in happy-dom, runs discovery skipping `/guides`, writes `lib/shop/pages.seed.json` (7 pages, 39 links); `DemoHost` passes it as `admin={{ navigate, pages }}`; the discover button gained an "Export" download
- [x] Runner: `seeded: true` loads the same file into the DOM host; `pageNavigate` step (the reader opens another page, as if clicking the nav); `expectPage.path`; the DOM host runs `watchPages` (30 ms quiet) and exposes `exportPages()` / `settle()`
- [x] Scenarios `admin-seeded` ("What can I do on the products page?" from `/settings`, answered from the seed, host still on `/settings`) and `admin-passive` (`/products` → `pageNavigate: /settings` → "What was on the products page?" answered from the passive cache); guide group, `docs/control-best-practices.md`
- [x] Docs: `admin.mdx` "Knowing pages ahead" (passive → seed → discover as a dev tool); README clause
Check: see the verification block in the report for this phase; `bun run test`, mock suite, real model on `admin-seeded admin-passive admin-cross-page admin-not-observed`, `bun run build:pages`.
Notes: with the real model `admin-passive` returned the cached `/products` (`cached: true`, 9 rows summarised) and the model then navigated there to read the rows for a fuller answer, so the scenario no longer pins the path; the mock path stays on `/settings`. The first passive implementation only captured after the first idle, so a page the user left within the quiet window was never recorded (the runner's `pageNavigate` exposed it); the watcher now captures at once and re-captures after the idle. The seed carries `observedAt` timestamps from the build, so any live observation is newer and wins; refs from a seeded page are validated against the live element like any other ref. Seeds include field values as rendered at build time (never sensitive ones); a host that does not want that runs the script against empty fixtures.

### Phase 10 — the pages file (2026-09-21)
Product decision: the pages the model knows ahead live in a JSON file in the host's repo, the dev server writes it, the app ships it; a developer never runs a separate discovery job. Replaces phase 9's `pages.seed.json` and `bun run discover`.
- [x] `src/admin/seed.ts`: `AdminPagesFile { version: 1, pages, links }` with no timestamps, pages sorted by path, links by href, only structural element fields (`ref role name within href options sensitive columns`, never values / checks / row counts); `toPagesFile`, `fromPagesFile`, `pagesFileEquals`, `serializePagesFile` (2-space, trailing newline), `parsePagesFile` (schema + 2 MB cap); `importPages(cache, data, observedAt)` (`seed.test.ts` 6)
- [x] `src/core/pages-file.ts` + handler: `admin: { pagesFile?, pages? }`; `PUT /api/chat { kind: "pages", file }` validates and writes only when the structure differs, 404 without `pagesFile` or with `NODE_ENV=production`; `GET` adds `pagesFile: { enabled }` (never the path) and `pages` (read fresh in dev, once in production; from `pages` when the host has no filesystem); `nodePagesFs` loads `node:fs/promises` on demand and returns null in a browser bundle (`pages-file.test.ts` 7, `handler.test.ts` +2)
- [x] `src/admin/sync.ts` + provider: `fetchPagesEndpoint` imports the served pages at startup (as of provider creation, so live captures win), `AdminOptions.sync` `"auto"` (default: debounced `PUT` after every cache change that changes the structure) / `"manual"` / `"off"`; `useVexaAdmin()` gained `canSave` and `save()` (`host.test.tsx` +3)
- [x] `<VexaDiscoverPages skip limit className />` in `vexa/react` (Discover, Save / Up to date, Export when the route cannot write); shop-admin's `discover-button.tsx` deleted, `top-nav.tsx` uses the component
- [x] `data-vexa-ignore`: the chat section, the overlay, the confirmation tray and the discover control carry it; `snapshot`, `collectLinks`, the resolver and the dialog rule skip such subtrees (`snapshot.test.ts` +1)
- [x] Shop-admin: `route.ts` `admin: { pagesFile: "lib/shop/vexa-pages.json" }` and exports `PUT`; `DemoHost` no longer imports the file; the static build copies it to `public/vexa-pages.json` (gitignored) and the in-browser handler serves it through `admin: { pages: () => fetch(...) }`; `pages.seed.json`, `scripts/discover-pages.ts` and the `discover` script removed; the runner still loads `lib/shop/vexa-pages.json` for `seeded: true`
- [x] Docs: `admin.mdx` "Knowing pages ahead" (passive → the pages file as a lockfile → Discover), security paragraph, config-reference snippets; README; CLAUDE.md
Check: `bun run typecheck`, `bun run test` (183), mock suite, real model on `admin-seeded admin-passive admin-cross-page`, `bun run build:pages`; in Chrome: PUT of an empty file → `written: true`, browsing `/products` → `/settings` → the file holds both pages, Discover → 7 pages, a second browse leaves the file byte-identical (md5), Save → "Up to date"; `NODE_ENV=production` → PUT 404.
Notes: the first version imported the JSON in `DemoHost`; every write then made Next dev reload the page (navigation type `reload`), which aborted discovery mid-walk and would have reloaded the app on every passive capture. The file therefore stays out of the client module graph and reaches the provider through GET. The first browser-written file also contained Vexa's own controls ("7 pages known", "Ask the shop assistant"), which churned the file on every label change; `data-vexa-ignore` removes them. Element state (values, `pressed`, `rows`) was dropped from the file for the same reason: the file records what exists, the live snapshot records what it shows.

### Phase 11 — automatic discovery in a hidden frame (2026-09-21)
Product decision: nobody should have to run or ship discovery; it happens by itself, invisibly, for every user, and the model can ask for it. The dev-written pages file stays supported but is no longer the shop-admin default.
- [x] `src/admin/frame.ts`: `createFrameHost()` — a hidden same-origin `<iframe name="vexa-discover">` (1 × 1 px off-screen, `opacity:0`, never `display:none` so `checkVisibility` works, `inert`, `aria-hidden`, `data-vexa-ignore`, `sandbox="allow-same-origin allow-scripts"` so a frame-busting script cannot move the user's tab); `open(path)` waits for load and reports `DISCOVERY_UNAVAILABLE` when the document is unreachable (`X-Frame-Options`, `frame-ancestors`), `about:blank`, redirected (login) or times out; `navigate` clicks a link in the frame when one exists, else sets `src`; `discoverInFrame()` runs `discoverPages` over the frame with a throwaway resolver so no ref points into it and closes the frame after; `isVexaFrame()` (`frame.test.ts` 4)
- [x] Recursion guard: the provider disables everything admin-related inside the frame and `VexaChatOverlay` renders nothing there — decided after mount (`useInDiscoveryFrame`), never during render, because the frame's first client render must match SSR (`host.test.tsx`, `overlay.test.tsx`)
- [x] `src/admin/store.ts`: `loadStoredPages` / `storePages` / `clearStoredPages` with `{ origin, scope }` — `scope` (the signed-in user) selects `localStorage` under `vexa-pages:<origin>:<scope>`; without it the pages live in `sessionStorage` per tab; `version` and a 24 h TTL invalidate; every access in try/catch (`store.test.ts` 7)
- [x] `AdminOptions.discover` (`"auto"` default / `"model"` / `"off"` / `{ mode, ttlMs, limit, skip }`), `scope`, `version`; auto discovery starts in `requestIdleCallback` (fallback 2 s), waits while an `admin_run` is executing, runs once per page load, stores the result, never retries once blocked; stored pages are restored in an effect after mount (a render-time read caused a hydration error); `useVexaAdmin()` gained `blocked`, `discover()` now runs in the frame too
- [x] `admin_discover` host tool (read tier, refuses spec buttons, answers `cached: true` while the last result is fresh, `DISCOVERY_UNAVAILABLE` with the reason otherwise; not registered with `discover: "off"`); prompt bullet; `tools.test.ts` +5, `prompt.test.ts` +1
- [x] Shop-admin: `route.ts` back to `admin: true`, no `PUT`; `DemoHost` `admin={{ navigate, discover: { skip: isDevOnlyPage } }}`; `vexa-pages.json`, the static-build copy and the `pages` fetch removed; the DOM host walks a second mounted copy of the app as its "frame" so `admin_discover` works in the runner; `seeded: true` restores a one-off discovery export instead of a file; scenario `admin-discover`; `admin-seeded` and `admin-not-observed` accept a discover-first path
- [x] Docs: `admin.mdx` "Knowing pages ahead" (automatic → the model can ask → passive → the optional pages file), "Discovery sees what the signed-in user sees", security bullet, error and troubleshooting rows; config-reference snippets; README; CLAUDE.md
Check: `bun run typecheck`, `bun run test` (204), mock suite 43/43, real model on `admin-discover admin-cross-page admin-not-observed admin-seeded` 4/4, `bun run build:pages`; in Chrome on `/settings` with cleared storage: `[vexa] discovering` after ~2 s, "7 pages known" about a second later, the tab never left `/settings`, the frame is gone afterwards, `sessionStorage["vexa-pages:http://localhost:3001"]` holds the seven pages; a reload logs `[vexa] pages restored (7)` and creates no frame; with the real model "Which page lets me create a new product, and what fields does its form have?" → `admin_discover` (cached) then `admin_observe { path: /products/new }` and a correct list of the form fields, still on `/settings`.
Notes: discovery sees what the signed-in user sees, so what it finds is stored per user (`scope`) or per tab and is still not a security boundary — the backend authorises (decided with the user, 2026-09-21). The first client render inside the frame must equal SSR, so both the provider and the overlay decide "I am the frame" in an effect; the frame-side effects also check `isVexaFrame()` so nothing starts there. Chrome warns once per frame load that `allow-scripts` plus `allow-same-origin` can escape the sandbox; that is accepted because the frame is our own origin and the sandbox is there to block top navigation, not to contain foreign code. Small models still answer some "where is X" questions from the persona without a tool; when they call `admin_discover` on a fresh result it returns at once.

## 11. Open questions

1. ~~Confirm once per plan or once per mutating step?~~ Resolved 2026-09-21: the default is the app's own dialog (`confirm: "page"`); under `"mutating"` it stays once per plan.
2. Snapshot as JSON objects or as text lines (`b3 button "Dark" pressed`)? Lines are ~30% fewer tokens; JSON is easier for the model to reference. Decide after measuring on `/orders` in phase 1.
3. Should `admin_observe` be merged into `context()` for small pages, saving one round trip? The 4 KB cap makes it unreliable; keep it a tool.
4. `navigate` to a path with no matching link on the page: `location.assign` (reload, loses state) or `ROUTE_NOT_FOUND`? Plan: `ROUTE_NOT_FOUND` unless `admin.navigate` is configured; a full reload is never silent.

## 12. Definition of done for the first slice (phases 0–6)

A host adds `admin: true` in two places and no other code or markup. In `examples/shop-admin` the chat can: describe what is on the page; change the locale and theme through the page controls; search the orders table and open a row; create, edit and delete a product through the products pages with a confirmation before submit and delete; report `TARGET_NOT_FOUND` / `TARGET_AMBIGUOUS` / `TARGET_STALE` / `DECLINED` with structured detail and without retrying; never receive a password or hidden value; do all of it with one `admin_run` call per task in the normal case. Every existing scenario still passes, `bun run typecheck` is clean, the guide pages play with the mock, and the docs page exists.

## 13. Known limitations (after phases 0–11)

- The executor drives one tab: no new windows, no file uploads, no `<canvas>` or drag interactions, no `location.assign`; a path with no link on the page needs `admin.navigate`.
- A control without an accessible name is invisible to the model and only counted in `unnamed`; `<div onClick>` and role-less custom widgets are not found. The fix is the app's accessibility, by design.
- The snapshot caps at 120 elements and summarises tables with more than five rows; very long pages need `within` scoping, and a row can only be addressed through its text.
- `waitForIdle` gives up silently after 5 s on a page that never settles (live clocks, spinners); a `submit` on such a page may be reported as ok before the server answered.
- Small models sometimes send steps as strings or announce a change without calling `admin_run`; the prompt carries a literal step object and the "same turn" rule, and the scenarios allow a second attempt.
- Under the default `confirm: "page"` a plain `submit` with no dialog commits without anyone asking; the app's own validation and dialogs are the only gate. The confirmation-dialog rule is structural (no inputs, one to four buttons), so a small buttons-only dialog that is not a confirmation (a "Saved" notice with OK) also stops the run once. Under `"mutating"` confirmation is once per plan; a plan with two submits asks once.
- Automatic discovery needs the app to render inside a same-origin iframe: `X-Frame-Options: DENY`, a `frame-ancestors` without `'self'`, a login redirect for framed requests or a page that never settles leave the model with `DISCOVERY_UNAVAILABLE` and page-by-page navigation; it costs one GET per page once a day per browser; the discovered map is the signed-in user's view and is stored for that user (`scope`) or that tab only.
- The optional pages file, when a host uses it, is read by the chat route at request time (once per process in production): a serverless deployment must ship the file next to the route (`outputFileTracingIncludes` in Next.js); it reflects the permissions of whoever browsed when it was written.
- The runner (`test:scenarios`) mounts the real pages in happy-dom: `next/link` navigation is emulated with a click listener and `useRouter().push` through `AppRouterContext`, so router-specific behaviour (prefetch, scroll restoration, `beforeunload`) is only covered by the browser guides.
- The observation cache lives in memory for the life of the provider: a reload keeps only what the stored discovery (or `admin.pages`) restores, up to a day old unless `version` changes. A cached page can be out of date; the model only learns that when a step fails with `TARGET_STALE` or `TARGET_NOT_FOUND` on the live page.
- Discovery follows links only: pages reachable through buttons, menus or forms are not found, and a section with fewer than three id-like children (or six of any kind) is listed page by page.
- The passive cache captures a page 300 ms after its route settles; a page the user leaves faster than that is recorded only as it was on arrival.
- No dev panel, no `data-vexa-*` override, no Playwright adapter (§9).
- Field trial on the react-admin e-commerce demo (`docs/admin-trial-react-admin.md`, 2026-09-21): hash routing, `role="menuitem"` links, discovery during the app's loader, MUI Select opening on `mousedown`, undoable (unconfirmed) deletes and the 120-element cap are the ranked findings; none was fixed in the trial.


## 14. Host tools off (measurement, 2026-09-21)

Switch: the shop store has `hostToolsEnabled` (Settings → Assistant → Host tools on/off, or open any page with `?hostTools=off`); `DemoHost` then passes no host tools, only `admin`. Runner: `VEXA_SCENARIO_HOST_TOOLS=off bun run test:scenarios` sends only the admin descriptors, ignores `scenario.tools`, mounts the real page for every scenario with a page (guide pages excepted), rewrites every shop host tool name in `expectTools` / `expectToolsAnyOf` / `approve` / `reject` to `admin_run` and allows a preceding `admin_observe`. The persona now emits its host-tool rules only when `set_filter` is registered, and a "no host tools" rule only when `admin_run` is (`lib/shop/chat-handler.ts`); before that the model hallucinated `open_order` from the rules text.

Real model `google/gemini-3.1-flash-lite`, full suite, host tools on 39/39, off 33/39:

| id | what it tests | on | off | why it failed with tools off |
|---|---|---|---|---|
| chat-elements | fixture render only | pass | pass | — |
| smoke | text-only reply | pass | pass | — |
| driver-smoke | spec driver check | pass | pass | — |
| navigate | route change from chat | pass | pass | admin_run clicked the Settings link |
| deep-link | open order, scroll section | pass | FAIL | model chose `get_order` (server) and showed data in chat; page not opened |
| page-state | filter page, read back | pass | FAIL | model chose `get_orders`; page filter untouched, so the follow-up saw no filter |
| context | read page context | pass | pass | — |
| button-runtool | spec button runs host tool | pass | FAIL | spec `runTool select_order` needs a host tool; `admin_run` refuses button source |
| watch-runtool | watch runs host tool | pass | FAIL | spec `watch` → `runTool load_branches` needs a host tool |
| server-runtool | button forwards to server tool | pass | pass | server tool only, unaffected |
| form-submit | spec form submit | pass | pass | runtime only, unaffected |
| host-to-chat | app sends text to chat | pass | pass | server tool only, unaffected |
| approval | confirm then reject a change | pass | FAIL | order page offers only "Mark paid" for a pending order; `update_status` bypasses that UI rule, admin_run cannot |
| denial-semantics | rejected server tool, no retry | pass | pass | server tool only, unaffected |
| server-tools | totals from server | pass | pass | server tool only, unaffected |
| mcp-stdio | MCP server tools | skip | skip | needs VEXA_DEMO_MCP=1 |
| injection | flagged tool result | pass | pass | server tool only, unaffected |
| registry | model list endpoint | pass | pass | — |
| theme-format | button runTool set_locale, confirm set_theme | pass | FAIL | spec button `runTool set_locale` needs a host tool (the chat half passed through admin_run) |
| bound-inputs | spec state binding | pass | pass | runtime only |
| validation | spec validation | pass | pass | runtime only |
| conditional-ui | spec visibility | pass | pass | runtime only |
| input-to-model | forwarded input to tool | pass | pass | server tool only |
| multi-step | multi-step spec | pass | pass | runtime only |
| patch-after-input | patch existing spec | pass | pass | no tools involved |
| narrow-panel | fixture render only | pass | pass | — |
| keyboard | fixture render only | pass | pass | — |
| admin-* (12) | page driving | pass | pass | already admin_run |

Conclusion. Of the seven scenarios that exercise a shop host tool from the chat (navigate, deep-link, page-state, approval, theme-format's chat half, plus the two admin-style ones), `admin_run` covered navigate, theme-format's chat half and every admin scenario; it lost deep-link and page-state to the model's preference for server tools when the request can be satisfied with data instead of by driving the page, and approval to a UI that only offers the next status transition. Two categories are structurally out of reach: spec-driven `runTool` from buttons and `watch` (button-runtool, watch-runtool, theme-format's press) needs a named host tool because `admin_run` refuses `source: "button"`, and any action the UI does not expose (a status jump the page forbids) needs a tool that bypasses the UI. None of the off failures is a library bug: the executor did what the page allowed each time; the remaining lever is prompt preference between server data and page driving, which is the host's persona to decide.
