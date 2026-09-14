# Demo as a control test bench

Status: **Done (rev 1)** · Revision 1 · 2026-09-12 · D1–D5b done 2026-09-12 (27 scenarios, `bun run test:scenarios` 27/27 with `mcp-stdio` skipped unless `VEXA_DEMO_MCP=1`); D6 done: `docs/control-best-practices.md` and `/docs/host/best-practices`

The public catalog gallery now lives on the docs site (`/docs/catalog`), so `demo/` stops being a showcase and becomes the place where we prove, one scenario at a time, every way the chat can control a host app. Each scenario is a page under `/tests/<case>` plus a scripted run against `/api/chat`. What a scenario teaches becomes a best-practice paragraph in the docs. Nothing in this plan changes the library API unless a scenario proves the API is missing something.

## 1. The host app the chat controls

Vexa Shop admin: a small in-memory app that has enough surface to exercise every control path. No database, no auth; data lives in `demo/lib/shop/data.ts` and a React store in `demo/lib/shop/store.tsx` (context + `useSyncExternalStore`, no new dependency).

| Route | Shows | Controlled by |
|---|---|---|
| `/` | overview: 3 metrics, revenue chart, recent orders | context only (what the assistant sees) |
| `/orders` | table with `status` and `search` filters, row selection | `set_filter`, `select_order`, `navigate` |
| `/orders/[id]` | one order: items, totals, timeline, actions | `open_order`, `update_status` (confirm), server `refund_order` (destructive) |
| `/settings` | theme, locale + currency, chat `steps` mode | `set_theme` (confirm), `set_locale` |
| `/tests` | index of scenario pages with pass/fail from the last run | — |
| `/tests/<case>` | one scenario: fixed spec or scripted prompts, expected outcome, notes | — |

The old `/catalog` page, `demo/components/catalog-gallery.tsx`, `demo/lib/catalog-gallery.ts`, and the `open_catalog_item` tool are removed. The library keeps `src/examples` because the docs site renders them.

## 2. Control paths under test

Sixteen ways the chat and the host touch each other, then eight that start from the user's hands inside the rendered UI (§2, Interactive UI). The scenario id is the `/tests/<id>` route and the file name in `demo/lib/test-plans/<id>.ts`.

| # | Scenario id | Path | What must be true |
|---|---|---|---|
| 1 | `navigate` | model calls a read host tool that changes the route | route changes without a reload; tool result under `/tools/navigate`; reply is one sentence |
| 2 | `deep-link` | model opens a route **and** scrolls to a section (`open_order` then `open_section`) | two tools in one turn run in order; second waits for the page |
| 3 | `page-state` | model changes UI state that is not a route (`set_filter` on `/orders`) | the table filters immediately; `context` on the next turn reports the filter |
| 4 | `context` | assistant answers from page context (`contextSchema`: route, filters, selected order) | no tool call needed; answer names the selected order; a context over 4 KB is rejected server-side |
| 5 | `button-runtool` | a spec `Button` calls a host tool through `runTool` (`source: "button"`) | result lands under `/tools/<name>`; `summary` reaches `/toast`; no model turn |
| 6 | `watch-runtool` | `Select` change triggers `runTool` via `watch` (country → cities) | cascade without a model turn; second Select binds `/tools/load_cities/cities` |
| 7 | `server-runtool` | a spec button names a **server** tool | client forwards `⟦action⟧ runTool …`; server rewrites unknown names; the model calls the tool |
| 8 | `form-submit` | `Form` + `submitForm` + `toast`; host `onToolResult` observes | validation blocks empty fields; `/toast` shows once; host callback receives the payload |
| 9 | `host-to-chat` | app UI calls `useVexaHost().runTool` and `sendToChat` (a "Ask about this order" button) | the same confirm/`onToolResult` gate as model calls; the chat opens with the message |
| 10 | `approval` | `confirm: true` host tool and `needsApproval` server tool | approval card; Reject → `ok:false` with "declined"; model says nothing changed and does not retry |
| 11 | `denial-semantics` | user rejects a destructive server tool twice | no retry loop; turn ends with a question, not an error |
| 12 | `server-tools` | read tools (`get_orders`, `get_order`) with `toolTiers` | model reads before answering; numbers in the reply match the data |
| 13 | `mcp-stdio` | a local stdio MCP server (filesystem on `demo/fixtures`) with an `allow` list | only allowed tools are visible; prefixed names; write tools need approval |
| 14 | `injection` | a tool result containing injected instructions | read-only downgrade for the turn; `data-notice` rendered; the model reports and does not comply |
| 15 | `registry` | picker list from `GET`, unknown id → 400, per-request `model` resolver by header | 400 body names the id; the picker never shows an id the server does not have |
| 16 | `theme-format` | `set_theme` and `set_locale` change tokens and number formatting live | charts and `Metric` reformat without reload; dark palette applies to the overlay |

### Interactive UI inside the chat

The scenarios above start from a prompt. These start from the user typing, picking, and pressing inside the UI the model rendered, because that is where generated specs break in practice: a value typed into an `Input` vanishes when the model patches the spec, a `Select` inside the panel cannot open, a form submits empty. Each one is a fixture page (deterministic, no model) **and** a scripted run where the model produces the spec first.

| # | Scenario id | What the user does in the chat UI | What must be true |
|---|---|---|---|
| 17 | `bound-inputs` | types into `Input`, toggles `Checkbox` and `Switch`, picks `RadioGroup` and `Select`, all bound to `/ui/*` | every value is readable at its path; model-sent defaults show; a `data-spec` patch to another element keeps typed values; nothing under `/tools` or `/host` is writable |
| 18 | `validation` | submits a `Form` with empty and invalid fields (`checks`, `validateForm`) | inline errors render in 340 px; `submitForm` does not fire; fixing the field clears the error |
| 19 | `conditional-ui` | flips a `Switch` that controls `visible`, adds items to a `repeat` list, presses a per-item button | hidden elements unmount; `$item` fields reach the button's `runTool` params; the tool receives the pressed item's id |
| 20 | `input-to-model` | fills a booking form, presses "Book" whose `runTool` params read `{ "$state": "/ui/…" }` | the `⟦action⟧ runTool book_room {…}` message carries the typed values; the server tool runs with them; approval card if the tool is write tier |
| 21 | `multi-step` | walks a two-step wizard rendered as `Tabs` + `Button` (next/back) | state survives switching tabs; the final submit sees both steps' values; back does not clear |
| 22 | `patch-after-input` | types a value, then the model answers a follow-up that patches the same spec (same ids) | the typed value survives; new elements appear below; the assistant message stays one message |
| 23 | `narrow-panel` | uses `Select`, `Carousel`, and a wide `Table` at 340 px inside the overlay | the Select popover opens inside the viewport; the carousel drags; the table scrolls horizontally without the panel scrolling |
| 24 | `keyboard` | tabs through a form and submits with Enter, closes the overlay with Escape | focus order follows the spec order; Escape closes only the popover first, then the overlay |

Two cross-cutting checks run in every scenario: state namespaces (`/tools`, `/host` writes from specs are dropped with a warning) and the one-assistant-message rule (host tool round trips continue the same message).

## 3. How a scenario is written

`demo/lib/test-plans/<id>.ts` exports one object:

```ts
export const scenario: Scenario = {
  id: "button-runtool",
  title: "Spec button runs a host tool",
  controlPath: "spec → runTool → host tool → /tools",
  page: "/orders",
  fixture: { spec, state },
  script: [
    { user: "Show the Bangkok orders as a table with a Reorder button", expectTools: ["set_filter"] },
    { press: "reorder-1042", expectState: { "/tools/reorder": { ok: true } }, expectNoModelTurn: true },
  ],
  bestPractice: "A button that only needs host data should call a host tool directly; route through the model only when the host tool name is unknown to the client.",
};
```

- `fixture` renders deterministically on `/tests/<id>` with `SpecView` (no model), like `/tests/chat-elements`.
- `script` runs against `/api/chat` with the real model through `demo/scripts/run-scenarios.ts` (`bun run test:scenarios [id]`): it sends the prompts with the host tool descriptors, asserts the tool calls and their order, executes host tools with a headless implementation, and prints pass/fail plus the model's text. Results are written to `demo/.scenario-results.json` for the `/tests` index.
- `bestPractice` is the sentence that goes into the docs; the scenario page shows it under the run.

A scenario may declare `attempts: 2` when the only remaining failure is model non-determinism on a small model (currently `denial-semantics`); the result notes which attempt passed so flakiness stays visible. `requiresEnv` skips a scenario with a note when its environment variable is unset (`mcp-stdio` needs `VEXA_DEMO_MCP=1` on both the dev server and the runner).

The runner is what finds the best practice: when a prompt produces the wrong tool order or a retry after denial, we change persona/rules/tool descriptions in the demo until it passes three runs in a row, then write down what made the difference.

## 4. Work breakdown

| # | Ticket | Days | Done when |
|---|---|---|---|
| D1 | Shop app: data, store, `/`, `/orders`, `/orders/[id]`, `/settings`; remove `/catalog` and the gallery files; host tools `navigate`, `set_filter`, `select_order`, `open_order`, `update_status`, `set_theme`, `set_locale`; context schema; server tools `get_orders`, `get_order`, `refund_order`; route `persona`/`rules` | 1.5 | typecheck; every route 200; chat can navigate and filter |
| D2 | Scenario framework: `Scenario` type, `/tests` index, `/tests/<id>` page, `run-scenarios.ts` with a headless host tool implementation and assertions | 1 | `bun run test:scenarios chat-elements` and one live scenario pass |
| D3 | Scenarios 1–8 (navigation, state, context, spec actions) | 1 | eight pages + scripts pass three runs |
| D4 | Scenarios 9–12 (host→chat, approval, denial, server tools) | 1 | four pages + scripts pass; denial never retries |
| D5 | Scenarios 13–16 (MCP stdio with a fixture directory, injection, registry, theme/format) | 1 | four pages + scripts pass; `demo/.mcp` config documented |
| D5b | Interactive scenarios 17–24: fixture specs for each, a headless spec driver in the runner (`press`, `type`, `pick`, `toggle` steps that go through the same `createVexaHandlers` and state store as the UI), scripted runs for 20 and 22 | 1.5 | eight pages; `bun run test:scenarios bound-inputs` passes; the 340 px checks are done in Chrome once and recorded as screenshots under `demo/fixtures/screens` |
| D6 | Best-practice write-up: `docs/control-best-practices.md` from the `bestPractice` lines, then `website/content/docs/host/best-practices.mdx` and links from Host tools, runTool, Security | 0.5 | every scenario cited once; page ≤ 800 words |

D1 and D2 run in parallel, D3–D5b after both, D6 last. Model per ticket: D1, D2 → Opus (library integration, typed config, runner design); D3, D4, D5, D5b → Sonnet (well-specified scenarios against a finished framework); D6 → Sonnet (prose). `bun run typecheck` and a curl of each new route close every ticket.

## 5. Out of scope

Playwright, visual regression, and CI wiring stay in docs-site plan Phase 5. Scenarios must be runnable by hand with one command before any of that.
