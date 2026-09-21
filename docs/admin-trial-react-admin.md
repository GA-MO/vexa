# Field trial: `admin: true` on the react-admin e-commerce demo

2026-09-21 · `examples/trial-react-admin/` (marmelab `examples/demo`, react-admin 5.15.3, MUI 7, MSW fake REST with generated data, hash router). Phase 1 (sections 2–7) measured without touching `src/`. Phase 2 (section 4b) applied the four smallest library fixes from the findings list and reran discovery and every task with a real model (`deepseek-v4-flash-0731` via QwenCloud, thinking off) through the chat in Chrome.

The trial ran in two phases. Observation (discovery, per-page snapshots, the login cases) and the first two tasks went through the chat with `google/gemini-3.1-flash-lite`. After that the OpenRouter key hit its total spending limit (`403 Key limit exceeded`, nine times in the dev server log) and every model turn failed, so tasks 1–5, the extra price task and the two generative-UI prompts were executed as scripted `admin_run` plans through the library's own `runPlan` in the page (`/@fs/…/src/admin/run.ts` imported into the tab, same deps as the provider builds: `document.body`, page-policy confirmation, no host `navigate`). That measures what the executor and the snapshot do on this app; whether the model would have produced those plans is marked "not measured" where it matters.

## 1. Setup: what a host had to do

| Piece | Lines | Notes |
|---|---|---|
| `src/App.tsx` | +6 | `import './vexa/vexa.css'`, `<VexaProvider admin>` around `<Admin>`, `<VexaChatOverlay />` after it. Wrapping outside `<Admin>` means the chat is also on the login page and Vexa has no `useNavigate`, so no `admin.navigate` |
| `src/vexa/vexa.css` | 3 | Tailwind + `vexa/styles.css` (workspace path). Tailwind preflight is layered and did not visibly disturb MUI |
| `src/vexa/chat-handler.ts` | 6 | `createVexaHandler({ models, admin: true })` |
| `src/vexa/models.ts` | 22 | OpenRouter registry copied from shop-admin |
| `vite/chat-api.ts` | 69 | copied from embedded-widget; loads `OPENROUTER_API_KEY` from `examples/shop-admin/.env.local` |
| `vite.config.ts` | workspace only | `vexa/*` aliases + `dedupe` for the library dependencies, plus `@mui/*`, `ra-*`, `react-router` (see below) |

A host installing from npm would write the first three rows and a chat route: about 35 lines, of which `admin: true` and `admin` are the two words that matter.

Unrelated to Vexa, the demo copied from react-admin `master` needed: `@mui/material`, `@mui/system`, `@mui/utils`, `@mui/icons-material` pinned to `^7` and deduped (the workspace resolved two copies of `ra-ui-materialui` against MUI 7 and 9, which throws `MUI: MenuListContext is missing` at the first menu item), `@mui/material/colors/<name>` imports rewritten to named imports, the GraphQL data provider variant removed, and `msw` kept as a dev dependency for the fake REST worker. Its own `tsc` reports type errors in the demo's files (`InputProps` on `NumberInput`, MUI type unions), so the trial is not part of the root `bun run typecheck`.

## 2. Discovery

| Measure | Result |
|---|---|
| Frame opens | yes, 756 ms to `load`; same origin; `contentDocument` reachable |
| Auth in the frame | localStorage token seen (`username=demo`) and, with the cookie variant of the auth provider, `trial_session=1` present in the frame's `document.cookie` |
| What the frame showed when the snapshot was taken | `Loading...` — the demo starts the MSW worker and generates its dataset after `load`; the idle wait (300 ms quiet) passed during the spinner |
| Pages found | 1: `/` with **0 elements** |
| Routes | `[{ path: "/" }]` — every link in this app is `href="#/orders"`; the route index only keeps hrefs that start with `/` |
| `admin_discover` (model turn, before the key limit) | `cached: true`, "1 pages known", reply "Currently, only the home page (/) exists." |
| Stored map | `sessionStorage["vexa-pages:http://localhost:3007"]` (no `scope` given) holding that one empty page; on a later session nothing was stored at all |
| Frame layout | the 1×1 px frame renders MUI's mobile breakpoint: 2 `menuitem`s instead of 13, drawer closed |
| `DISCOVERY_UNAVAILABLE` | never; the frame is not blocked, it just sees nothing useful |

Discovery is therefore useless on this app for three independent reasons: hash routing, snapshot-before-render, and the frame's viewport. Passive cache and `admin_observe` on the current page still work.

## 3. Per-page observation (live snapshots, `unnamed` is the library's counter)

| Page | Elements | `unnamed` | Seen correctly | Missing or misleading |
|---|---|---|---|---|
| Login `#/login` | 5 | 0 | form, `Username *`, `Password *` as `sensitive: true` with no value, `Show password`, `Sign in` | — |
| Dashboard `#/` | **120 (truncated)** | 0 | headings, KPI card links, pending-order links, welcome links | the whole sidebar (`<a role="menuitem">` ×13) is invisible; 107 list links push later cards past the cap; card links have concatenated names (`"New Orders35"`, `"Yazmin Keebler19/09/2026, 22:44:46by Yazmin Keebler, 2 items55.78$"`) |
| Orders list `#/orders` | 25 | 0 | search, `Add filter`, `Columns`, `Export`, tabs `ordered (35)` / `delivered (513)` / `cancelled (52)`, table with columns and row count, `Rows per page` combobox, pagination | sidebar; rows are clickable `<tr>` with no link; row checkboxes are inside the summarised table; bulk `Unselect` / `Delete` listed although nothing is selected |
| Order edit `#/orders/538` | 26 | 0 | prev/next links, MUI Select as `combobox "Status ordered"`, `switch "Returned"`, customer links, items table with columns, `Save`, `Delete` | select name is label + current value; Save is disabled until the form is dirty (reported as `ELEMENT_NOT_INTERACTABLE: disabled`, which is right) |
| Customers list `#/customers` | 41 | 0 | `Create` link, search, table (8 columns, 25 rows), pagination, filter sidebar as buttons | sidebar filters have no group scope: `Yes` / `No` appear twice (Has ordered, Has newsletter) with nothing to tell them apart; row names carry the avatar initial (`"AArmando Hagenes"`) |
| Customer edit `#/customers/759` | 29 | 0 | every field with its label and value, `Password` / `Confirm password` as `sensitive`, `Segments` and `Has newsletter` comboboxes, `Save`, `Delete` | combobox names concatenated (`"Has newsletter Yes"`) |
| Reviews list `#/reviews` | 28 | 0 | search, `Add filter`, `Create`, bulk `Accept` / `Reject` / `Delete`, table, pagination | rows open a side drawer (no link); the status filter lives behind `Add filter` |
| Products list `#/products` | 67 | 0 | sort button, `Create`, filter buttons (sales, stock, categories), 24 product cards as links | card link names concatenate title, size and price |
| Categories list `#/categories` | 47 | 0 | 13 cards each with a heading, `Products` and `Edit` links | `Products` ×13 and `Edit` ×13 are only distinguishable by the heading above them, which is not a scope role |
| Category edit `#/categories/0` | 15 | 0 | `Name`, products table, `Save` | two `Delete` buttons (bulk toolbar and record) → ambiguous |

`unnamed` was 0 everywhere: react-admin's own markup is well labelled. The misses are roles Vexa does not list (`menuitem`), structure Vexa does not scope (cards, filter sections), and names Vexa builds from too much text.

## 4. Tasks

Recorded as executed. "Model" is what the real model did before the key limit; "executor" is the scripted plan a model would have to produce.

### Task 1 — dashboard: "Show me the orders that are still pending"

Model: not measured (key limit). Executor:

```
navigate "Orders"          → TARGET_NOT_FOUND  no link "Orders" on the page      (menuitem role not listed)
navigate "/orders"         → ROUTE_NOT_FOUND   href is "#/orders", no host navigate
click link /^New Orders/   → ok               hash changed to #/orders, no wait, returned page = the dashboard (120 elements)
click tab /^ordered/       → ok               list filtered to the "ordered" tab (react-admin's pending)
```

PARTIAL — `navigation`. Reaching the list needs a hash-aware navigate or the sidebar; once there the tab works.

### Task 2 — customers list: "Open the customer Armando Hagenes"

Model (first attempt, before the key limit, on the list page): `admin_observe` only, answered with a control inventory; not retried. Executor:

```
fill textbox "Search" = "A\nArmando Hagenes"   → ok   (the list text I copied included the avatar initial)
wait idle                                       → ok   "Page settled"
read table /.*/                                 → ok   25 rows, unfiltered: react-admin debounces the filter 500 ms and the fake server adds 300 ms, the idle window closed before the request fired
click row /Hagenes/                             → ok   #/customers/293, "Customer Armando Hagenes"
click cell /Hagenes/                            → TARGET_NOT_FOUND (cell is scope-only)
```

PASS — `row` is clickable and the edit page opened. Two side findings: `read` after a debounced filter returns stale rows (`other`/timing); exact names fail on `"AArmando Hagenes"` (`a11y-name`), regex works.

### Task 3 — categories: "Add a new category called Winter collection"

Not possible in this app: the categories list has no `Create` (the demo only edits categories). Substitute: "Rename the category Animals to Wild animals".

```
fill textbox "Name" = "Wild animals"   → ok
submit button "Save"                   → ok   "Category updated · UNDO", redirected to #/categories
```

PASS. Note react-admin's update is undoable: the notification offers UNDO for a few seconds; Vexa reported success at once.

### Task 4 — order edit: "Mark this order as delivered"

```
click row /.*/ nth 0                         → ok   but nothing happened: nth 0 is the header row
click row /PMLMCH3G/                         → ok   #/orders/279
select combobox /^Status/ = "delivered"      → ELEMENT_NOT_INTERACTABLE  no listbox
submit button "Save"                         → ELEMENT_NOT_INTERACTABLE  disabled (form pristine, correct)
```

By hand in the same tab: `mousedown` on the combobox opens the listbox (`aria-controls` is only set while open; options `""`, `delivered`, `ordered`, `cancelled`, `unknown`), clicking the option closes it and enables Save; then `submit "Save"` → ok, "Order updated · UNDO". FAIL for the library as it is — `custom-widget`: MUI Select opens on `mousedown`, the executor sends `click`.

### Task 5 — reviews: "Delete the first pending review"

```
click row /Darnell/                                      → TARGET_AMBIGUOUS  3 rows, candidates listed with full row text
click row /Darnell/ nth 0                                → ok   #/reviews/269, review drawer opened (Accept / Reject, no Delete)
check checkbox /.*/ within row /Darnell/ nth 0           → ok   "1 item selected"
click button "Delete" within "b18"                       → TARGET_NOT_FOUND (a ref as `within` is the button itself)
click button "Delete" nth 0                              → ok   "Review deleted · UNDO", 25 → 24 rows
```

PASS as a task, but the important result is what did not happen: react-admin deletes are **undoable, not confirmed** — no dialog opened, the row was gone at once with a five-second UNDO toast. Under the default `confirm: "page"` Vexa asked nothing, because the policy waits for the app's dialog and there is none. `confirm-policy`.

### Extra — product edit: "Change this product's price to 49.90"

Blocked by the app: every product edit page in this copy fails with `Element does not exist` / `Failed to fetch` from the demo's data layer (orders, customers, reviews and categories edit pages work). Not a Vexa finding.

### Generative UI (added mid-trial): "Show me the pending orders as a table here in the chat", "Summarise this month's revenue in a card"

Not measured: both need a model turn and the key limit was reached first. What the model would have had: this app registers no server tools, so a spec can only come from `admin_run [read table]` on the orders list (columns + rows are returned) or from the KPI headings on the dashboard (`"$5,435"` is a heading, `"New Orders35"` a link name). To rerun once the key works: send the two prompts from `#/orders` and `#/`, then check the reply for a `data-spec` part (`evaluateSpec` from `vexa/eval`) and which tools ran.

## 4b. Second run — after the four small fixes, with a real model

Library changes between the runs (each with a unit test in `src/admin/*.test.ts`): (1) routes are read the same way under a hash router (`src/admin/paths.ts`: `#/orders`, `/#/orders` and `/orders` are one route; `currentPage()` returns the hash route; the cache, `navigate`, link matching and the frame use it), and a route change now waits for the screen to settle before the next step reads it; (2) `menuitem`, `menuitemcheckbox`, `menuitemradio`, `treeitem` and `gridcell` are interactive roles, and a link keeps its `href` whatever its role, so the sidebar feeds the route index; (3) `click`, the custom-select trigger and its options press like a pointer (`pointerdown → mousedown → pointerup → mouseup → click`); (4) the discovery frame is 1280×800 off screen and a page is stored only once it shows a control (3 s cap). Nothing else in `src/` changed for this section.

**Discovery, logged in, storage cleared**: 8 pages stored in 76 s — `/` (19 elements), `/categories` (19), `/customers` (40), `/invoices` (23), `/orders` (28), `/products` (32), `/reviews` (25), `/segments` (20) — plus 39 links; routes include `/orders/:id`, `/customers/:id`, `/reviews/:id`, `/products/create`, `/reviews/create`, `/customers/create`. Before the fixes the same run stored one empty page. The frame shows the desktop sidebar (13 menu items). Two things still stand out: ~9 s per page (the idle wait runs into its 5 s cap on every react-admin screen, something keeps mutating), and when the app opens on `#/login` the automatic run stores only `/login` and does not run again after the user signs in (one run per page load, and a hash login never reloads).

**Tasks, real model, natural prompts, one chat each** (tool sequence = what the model called; the trace comes from the expanded tool parts):

| # | Prompt (page) | Tools | What happened | Result | Class |
|---|---|---|---|---|---|
| 1 | "Show me the orders that are still pending" (dashboard) | `admin_observe`, `admin_run` ×3 | `navigate /orders` → ok (the sidebar link, hash route, page returned in the trace); `read tab "ordered"` → `TARGET_NOT_FOUND` (the tab's accessible name is `ordered23`, an exact match on `ordered` misses); `read table t31` → 23 rows; reply = a Table spec in the chat (Date, Reference, Customer, Nb Items, Total) | **PASS** (20 s) | one `a11y-name` miss on the way |
| 2 | "Open the customer Brielle Franecki" (customers list) | `admin_observe`, `admin_run` ×4 | fill the search, read the table, click the row → `#/customers/715`; reply summarises the record (identity, newsletter, no orders) | **PASS** (~20 s) | — |
| 3 | "Rename the category Animals to Wild animals" (categories) | `admin_observe`, `admin_run` ×7, `admin_observe` | found the card, navigated to `/categories/0` directly, filled `Name`, clicked Save, went back and confirmed the list shows "Wild animals" | **PASS** (~45 s) | many round trips: one step per call |
| 4 | "Mark this order as delivered" (order edit `#/orders/452`) | turn 1: `admin_run` ×5; turn 2: `admin_observe` ×2, `admin_run` ×7 | turn 1 did not look at the open page (the trial passes no `context`): it opened `/orders`, read the list and asked which order. Turn 2 ("the one open on my screen"): `select s24 "delivered"` → `ELEMENT_NOT_INTERACTABLE: no listbox` — the run was before the pointer fix reached the custom-select trigger — the model recovered by clicking the combobox, clicking the option, clicking Save, then reopened the order and confirmed `delivered` | **PASS after one clarification** | `context` (no page context from the host) + `custom-widget` (fixed after the run: `select` on the same MUI Select now opens the listbox and commits the option in one call, verified in the tab) |
| 5 | "Delete the first pending review" (reviews list) | `admin_observe` ×4, `admin_run` ×29 | found the first pending row, then looped trying to tick its checkbox: per-row checkboxes sit inside the summarised table so they are not in the snapshot, `within: row` was tried with the wrong roles, `nth: 0` landed on the header, a `gridcell` was tried last; 33 tool calls, no deletion, the turn ended without a result | **FAIL** | `model-planning` + `snapshot` (row controls are invisible until addressed with `within: { role: "row", name }`) + no cap on host-tool round trips in one turn |
| UI a | "Show me the pending orders as a table here in the chat" (orders list) | `admin_observe`, `admin_run` | `read table` → a Table spec in the chat with the list's 25 rows and 6 columns | **PASS** (15 s) | — |
| UI b | "Summarise this month's revenue in a card" (dashboard) | `admin_observe` | a Card with $9,910 (matches the dashboard KPI), a day-by-day trend, top order, largest customer, average order value | **PASS** (21 s) | — |
| extra | "Change this product's price to 49.90" | — | product edit pages still fail in this copy of the demo (`Failed to fetch`) | blocked by the app | — |

Compared with the scripted first run: tasks 1 and 4 moved from PARTIAL/FAIL to PASS (hash navigation, menu roles, mousedown), task 5 moved from a PASS-by-accident (undoable delete ran at once) to a FAIL of planning, and the two generative-UI prompts, unmeasured before, both produce correct specs from page reads.

New findings from this run, appended to the ranked list: (18) the model does not look at the open page when the host gives no `context` — "this order" was resolved by opening the list; (19) a turn has no cap on host-tool round trips — 33 calls in one turn; (20) the automatic discovery that ran on the login page is never repeated after sign-in; (21) exact names fail on tab labels that carry a count (`ordered23`).

## 5. Login

Storage cleared before each case; the trial's `authProvider` was extended (trial only) to set `trial_session=1` on login, remove it on logout and require it in `checkAuth` for case 3.

1. **Logged out.** `http://localhost:3007` → `#/login`. Auto discovery ran, found `/` with 0 elements (the app was still on its loader) and stored it; no `DISCOVERY_UNAVAILABLE`. `admin_observe` on the login page: 5 elements, `Password *` is `sensitive: true` with no value. "log me in as demo / demo" (real model): `admin_observe` → `admin_run [fill i2 "demo", fill i3 "demo", click b5]` → all ok, logged in (`localStorage.username = demo`); the model then observed `/` again and reported "It appears I've successfully logged in." The password was filled by the model; the trace summary echoes it (`Filled with "demo"`). Opinion: filling a password field should be refused unless the value appears verbatim in the user's own message of that turn, and the trace must never echo a sensitive value; a model inventing or reusing a password is the case to prevent, a user dictating one is fine.
2. **localStorage token.** The frame shares it: the app inside the frame rendered the dashboard as `demo` after its data generation (about 6 s). Discovery still recorded only `/` (hash routes, snapshot-before-render). Stored under the `scope`-less `sessionStorage` key.
3. **Cookie session.** Same result: `trial_session=1` is present in the frame document, the framed app passes `checkAuth`. Same-origin frames carry cookies; nothing to do here.
4. **Logout.** The stored pages are keyed by origin only when no `scope` is passed, so they outlive the session inside the tab (they are in `sessionStorage`, so they die with the tab). The chat keeps working on the login page (case 1 is exactly that). Recommendation: hosts pass `scope: userId`; the library should drop stored pages when `scope` changes and expose `clearPages()` for logout handlers.
5. **Session expiry mid-plan.** Token and cookie removed by hand, then `[click row /CUTJ5PIA/, wait idle, select combobox /^Status/]`: the row click ran, react-admin's `checkAuth` redirected to `#/login`, the select failed with `TARGET_NOT_FOUND` and the returned `page` is the login form (5 elements, password `sensitive`). No dedicated code; a model reading the page would see a login form where an order was expected. A `SESSION_EXPIRED` hint when the post-step page is a login form (a form whose only inputs are a text/email field and a password field) would let it say so directly.

## 6. Findings, ranked by impact

| # | Finding | Class | Candidate fix |
|---|---|---|---|
| 1 | **Hash routing is not a route.** `location.pathname` is always `/`, `routes` is `[/]`, `navigate "/orders"` → `ROUTE_NOT_FOUND`, `navigate "Orders"` → not found, hash-link clicks return the pre-navigation page, the cache has one key for every screen, discovery has nothing to follow. react-admin, many older SPAs and every `HashRouter` app are in this bucket | `navigation` | library: `currentPage()` returns `pathname + hash` when the hash starts with `#/`; `collectLinks`, `linkForPath`, `navigate` and `waitForNavigation` treat `#/x` like `/x`; the cache keys by that route |
| 2 | **`role="menuitem"` links are invisible.** react-admin's whole sidebar is `<a role="menuitem" href="#/…">`; the explicit role wins over the implicit `link` and `menuitem` is in no list | `a11y-name` (role list) | library: list `menuitem`, `menuitemcheckbox`, `menuitemradio`, `treeitem`, `gridcell`; keep the `href` on a `menuitem` |
| 3 | **Discovery snapshots the loader.** `open()` resolves on `load`; 300 ms of quiet during a spinner counts as settled; the map stores empty pages | `other` (timing) | library: after `load`, wait until the page has at least one interactive element or until mutations stop for 1 s with a 5 s cap, and never store a page with 0 elements |
| 4 | **MUI Select opens on `mousedown`.** `select` on `combobox "Status …"` → `ELEMENT_NOT_INTERACTABLE: no listbox`; a `mousedown` opens it and the rest of the path works (portalled listbox, `aria-controls` set only while open) | `custom-widget` | library: `click()` in actions dispatches `pointerdown → mousedown → mouseup → click` on the trigger (what Playwright does) |
| 5 | **Undoable deletes bypass the page policy.** react-admin (and Gmail-style UIs) do not confirm; they act and offer UNDO. `confirm: "page"` asked nothing and the review was gone | `confirm-policy` | library: after a click, an appearing `role="alert"` with an "Undo" control is reported as `stopped: "undoable"` with the toast text so the model tells the user they can undo; optionally `page` policy asks before a click whose name matches `DESTRUCTIVE_NAMES` when the app has never shown a confirmation dialog for it |
| 6 | **The 120-element cap truncates dashboards.** 107 links (pending orders, reviews, new customers) filled the snapshot; later cards were cut | `other` (snapshot) | library: collapse a run of sibling links with the same parent into one summarised group like tables (`list "Pending orders" items=14`), and raise the cap when the page is mostly such groups |
| 7 | **Rows without links.** react-admin rows are clickable `<tr>`s. `click row` works (good, and was not in the docs), but `nth: 0` hits the header row and `cell` cannot be a target; row names include avatar initials (`"AArmando Hagenes"`) | `a11y-name` / executor | library: exclude `thead` rows from `row` matches, allow `cell` as a click target, build a row's name from `td` text only |
| 8 | **Debounced filters.** `fill "Search"` then `read` returned the unfiltered table: react-admin debounces 500 ms and the fake server adds 300 ms; the idle wait ended in between | `other` (timing) | library: after `fill`/`select` on a control inside a `form` that is not submitted, wait for the next DOM change up to ~1.5 s before the following `read`, or add `wait: { ms }` |
| 9 | **Ambiguous repeated controls.** `Yes`/`No` twice in the filter sidebar, `Products`/`Edit` ×13 on category cards, `Delete` twice on an edit page; the only disambiguator is a nearby heading, which is not a scope | `a11y-name` (app) + library | app: `fieldset`/`aria-labelledby` on filter sections, `aria-label` on card links; library: accept a `heading` as `within` and report the nearest heading as a candidate's `within` |
| 10 | **Concatenated names.** MUI Select = label + value (`"Status ordered"`), card links = whole card text, `Rows per page: 25` | `a11y-name` | library: for `combobox` prefer the associated label over text content; prompt: name matching by `/regex/` is the safe default for long names |
| 11 | **Password fields are fillable and echoed.** See Login 1 | `confirm-policy` / sensitive data | library: refuse `fill` on `sensitive` fields unless the value is present verbatim in the user's last message (the tool gets that text from the chat), and never put a sensitive value in `summary` |
| 12 | **Stored map outlives the user.** Without `scope` the tab keeps another user's map after logout | `other` (storage) | library: `clearPages()` on `useVexaAdmin`, clear on `scope` change; docs: pass `scope` |
| 13 | **Session expiry has no name.** A redirect to the login page mid-plan surfaces as `TARGET_NOT_FOUND` plus a login form in `page` | `other` | library: detect a login form in the post-step page and add `SESSION_EXPIRED` to the failed item's `detail` |
| 14 | **The frame is 1×1 px.** Responsive apps render their mobile layout in it (react-admin: drawer closed, 2 menu items) | `other` (discovery) | library: size the frame to the viewport and move it off screen instead of shrinking it |
| 15 | **Bulk toolbar listed while nothing is selected.** `Unselect`, `Delete`, `Accept`, `Reject` are in the snapshot before any row is checked; react-admin keeps the toolbar rendered | `other` (app) | app-level; a model clicking `Delete` with nothing selected is a no-op |
| 16 | **`admin_observe { path: "/" }` once returned the previous screen** (the customers list while the customer edit page was on screen), not reproduced with a direct `snapshot(document.body)` on the same page; may be model-side reuse of the earlier tool result on the same `path` | `other` (unexplained) | library: a test that observes two different hash screens under the same pathname; fixed structurally by finding 1 |
| 17 | **Undoable updates are reported as done.** `Category updated · UNDO`; the mutation applies after the toast unless undone | `other` | library: same detection as finding 5, non-blocking |
| 18 | **"This order" without page context.** The trial host passes no `context`; the model resolved "this order" by opening the orders list and asking, instead of observing the page it was on (section 4b, task 4) | `model-planning` / host | host: pass `context` with the current path and record id; library prompt: when the user says "this", observe the current page first |
| 19 | **No cap on host-tool round trips in one turn.** Task 5 ran 33 tool calls in one turn before giving up; `stopWhen` bounds steps per request, not the client-driven host-tool loop | `other` (runtime) | library: cap host-tool round trips per user turn (the runner already uses 6) and tell the model when the budget is spent |
| 20 | **Discovery on the login page is final.** The automatic run stores `/login` and never runs again after a hash-router sign-in (no reload) | `other` (discovery) | library: re-run when the stored map holds only a login page, or when `scope` changes |
| 21 | **Tab names carry their count.** `ordered23` — an exact `name: "ordered"` misses; the model then read the table instead | `a11y-name` | library: match the start of a name before failing, or strip trailing counts; prompt: regex names |

Trial infrastructure, not findings: the demo needed dependency pins and small source edits to run outside its monorepo; product edit pages fail in this copy; the OpenRouter key limit ended the model phase.

## 7. Accessibility gaps in react-admin's own markup

- Filter sidebars (`FilterList`) are lists of buttons under a plain heading, no `fieldset` or `aria-labelledby`, so `Yes`/`No` repeat without context.
- Category cards and dashboard KPI cards wrap their whole content in one link, giving it a concatenated name; an `aria-label` on the link would fix it.
- Data rows are clickable `<tr>`s without `role="button"` or a link; keyboard users have the same problem the executor has.
- Avatar initials are text inside the row, so every customer name starts with a duplicated letter in the accessible name.
- The bulk-actions toolbar stays in the DOM (and visible to `checkVisibility`) with no selection.
- Everything else (labels, `aria-label` on icon buttons, tabs, comboboxes, switches, dialogs) is correct: `unnamed` was 0 on every page.

## 8. Verdict

First run (scripted plans, no model): of the five tasks the executor completed two, one only because react-admin skips confirmation, and could not complete two without library changes. Second run (real model, four small library fixes): **4 of 5 tasks pass end to end, both generative-UI prompts pass**, one task fails on planning. Discovery went from one empty page to 8 real pages. What made the difference was small and generic — hash routes, menu roles, pointer events, a frame with a viewport — which is the encouraging part: the app-specific gaps (row controls hidden in a summarised table, undoable deletes, tab names with counts) are the same kind of finding, and none of them needed react-admin to change. What still limits "arbitrary React admin": a host that passes no `context` leaves the model blind to "this" (task 4), the executor keeps the mutating policy honest but the model can loop through 30 tool calls in one turn (task 5), and every react-admin page costs the full idle timeout during discovery. Finding 5 (undoable actions) is still the policy decision to make before the next app.
