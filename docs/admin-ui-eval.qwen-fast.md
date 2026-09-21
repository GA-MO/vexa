# Generative UI with admin on and off — qwen-fast

Ten real-user prompts on the shop admin, each run 2 times per mode with `server default` (2026-09-21). "on" = `admin: true` on the server and the `admin_*` host tools sent by the client, as shop-admin ships; "off" = `VEXA_ADMIN=off` and no admin descriptors. The shop's own host tools are registered in both modes.

A `ui` case passes only when the rendered data matches `lib/shop/data.ts` (`verify` in `lib/eval-ui/cases.ts`: the right order ids in the table, the right counts in the chart, a real aggregate in a metric); the other kinds pass on presence checks. Every run is also scored by the same model on a fixed rubric (answers / fit / concise, 0–2 each), reported as mean (min–max). Detours = admin tools called in a `ui` case.

```bash
bun run dev                       # admin on (default)
bun run eval:ui -- --mode=on
VEXA_ADMIN=off bun run dev        # restart the server with admin off
bun run eval:ui -- --mode=off --report
bun run eval:ui -- --runs=0 --report   # rebuild this file (and the /tests/eval-ui fixture) without calling the model
bun run eval:ui -- --runs=0 --rescore --report   # re-verify stored replies after a change to lib/eval-ui/cases.ts
VEXA_EVAL_LABEL=gemini VEXA_SCENARIO_MODEL=gemini-3.1-flash-lite bun run eval:ui -- --mode=on --pace=20000   # another model, its own files
```

## Summary across models

UI cases only (7 cases × runs). Each label is one `.eval-ui.<label>.json`.

| label | admin | model | correct | specs | detours | judge mean (min–max) | latency (median) |
|---|---|---|---|---|---|---|---|
| deepseek | on | deepseek-v4-flash-0731 | 33/35 | 34/35 | 0 | 5.1/6 (0–6) | 11.2 s |
| deepseek | off | deepseek-v4-flash-0731 | 25/35 | 32/35 | 0 | 5.0/6 (0–6) | 9.5 s |
| gemini-v2 | on | gemini-3.1-flash-lite | 9/14 | 12/14 | 3 | — | 11.5 s |
| gemini-v2 | off | gemini-3.1-flash-lite | 10/14 | 13/14 | 0 | — | 9.1 s |
| gemini | on | server default | 9/14 | 11/14 | 0 | — | 8.1 s |
| gemini | off | server default | 9/14 | 14/14 | 0 | — | 9.9 s |
| qwen-fast | on | server default | 2/14 | 5/14 | 2 | — | 12.7 s |
| qwen-fast | off | server default | 6/14 | 7/14 | 0 | — | 12.2 s |
| qwen | on | server default | 9/14 | 10/14 | 3 | — | 72.4 s |
| qwen | off | qwen3.8-flash | 9/14 | 12/14 | 0 | — | 46.7 s |

## Results

| case | kind | admin on | admin off |
|---|---|---|---|
| pending-orders | ui | 0/2 · judge — · spec 0/2 · detours 0 · 5.2 s | 0/2 · judge — · spec 0/2 · detours 0 · 5.9 s |
| city-chart | ui | 0/2 · judge — · spec 1/2 · detours 0 · 46.4 s | 0/2 · judge — · spec 0/2 · detours 0 · 14.8 s |
| order-summary | ui | 1/2 · judge — · spec 1/2 · detours 0 · 12.1 s | 2/2 · judge — · spec 2/2 · detours 0 · 23.7 s |
| note-form | ui | 1/2 · judge — · spec 2/2 · detours 0 · 8.8 s | 1/2 · judge — · spec 2/2 · detours 0 · 13.1 s |
| revenue-by-status | ui | 0/2 · judge — · spec 1/2 · detours 1 · 34.4 s | 0/2 · judge — · spec 0/2 · detours 0 · 11.8 s |
| chiang-mai-orders | ui | 0/2 · judge — · spec 0/2 · detours 1 · 18.1 s | 2/2 · judge — · spec 2/2 · detours 0 · 8.2 s |
| show-and-open | hybrid | 2/2 · judge — · spec 2/2 · 15.9 s | 1/2 · judge — · spec 1/2 · 12.9 s |
| settings-question | question | 2/2 · judge — · spec 0/2 · 7.8 s | 2/2 · judge — · spec 0/2 · 6.6 s |
| add-product | drive | 2/2 · judge — · spec 0/2 · 13.6 s | 0/2 · judge — · spec 2/2 · 15.3 s |
| week-dashboard | ui | 0/2 · judge — · spec 0/2 · detours 0 · 19.7 s | 1/2 · judge — · spec 1/2 · detours 0 · 35.5 s |

Cells: correct/runs · judge mean (min–max) · runs with a spec · admin detours (ui cases) · median latency.

## Cases

### pending-orders — ui · `/`

> Show me the pending orders

**admin on** (run 1 of 2) — fail (no spec) · no judge · tools: set_filter · 5542 ms

Other failing runs: run 2: no spec

Text: I've opened the orders page filtered to **pending** — 4 orders match:

| Order | Customer | City | Total (฿) |
|---|---|---|---|
| C-1042 | Napat Srisuwan | Bangkok | 2,070 |
| C-1039 | Kanya Thongdee | Bangkok | 1,160 |
| C-1031 | Sara Kim | Chiang Mai | 1,960 |
| C-1023 | Oliver Grant | Khon Kaen | 320 |

Want me to open any of these, or mark one as paid/shipped?

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — fail (no spec) · no judge · tools: set_filter · 6220 ms

Other failing runs: run 2: no spec

Text: I'll filter the orders table to show pending orders.


There are 4 pending orders, now shown in the filtered table on /orders:

| Order | Customer | City | Total (฿) |
|---|---|---|---|
| C-1042 | Napat Srisuwan | Bangkok | 2,070 |
| C-1039 | Kanya Thongdee | Bangkok | 1,160 |
| C-1031 | Sara Kim | Chiang Mai | 1,960 |
| C-1023 | Oliver Grant | Khon Kaen | 320 |

Want me to open any of these for item-level details?

```
(no spec)
```

Validation: / Spec is empty

### city-chart — ui · `/`

> Which city has the most orders? Show it as a chart

**admin on** (run 1 of 2) — fail (invalid spec: /elements/chart/children Invalid input: expected array, received undefined) · no judge · tools: get_orders, get_orders, get_orders, get_orders, set_filter, set_filter, set_filter, set_filter · 78905 ms

Other failing runs: run 2: no spec

Text: The data tool is being finicky, so let me count orders per city using the orders page filters instead.


Bangkok leads with 10 orders, well ahead of Chiang Mai and Phuket (5 each) and Khon Kaen (4). Here's the breakdown as a chart:

```
Card(title: "Orders by city"; description: "All 24 orders on file, newest page load …")
  BarChart(labels: 4 items; series: 1 items; horizontal: true; showValues: true)
  Text(content: "Bangkok has the most orders — twice as m…"; muted: true)
```

Validation: /elements/chart/children Invalid input: expected array, received undefined; /elements/note/children Invalid input: expected array, received undefined

**admin off** (run 1 of 2) — fail (no spec) · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders, get_orders · 15050 ms

Other failing runs: run 2: no spec

Text: I'll count orders per city from the order list, then chart it.

```
(no spec)
```

Validation: / Spec is empty

### order-summary — ui · `/orders/C-1042`

> Give me a summary of this order

**admin on** (run 1 of 2) — pass · no judge · tools: get_order · 16908 ms

Other failing runs: run 2: no spec

Text: I'll pull up order C-1042 for you.


Here's the summary of order C-1042.



Quick recap: **C-1042** is a pending order from Napat Srisuwan in Bangkok, placed yesterday (Sep 20) — a ceramic pour-over set and 2× single-origin beans 250g, totaling ฿2,070 with free shipping.

```
Stack(direction: "vertical"; gap: "md")
  Card(title: "Order C-1042"; description: "Placed 2026-09-20 · Status: pending")
    Badge(label: "Pending"; tone: "warning")
    KeyValue(pairs: 4 items; size: "md")
  Card(title: "Line items")
    LineItems(items: 2 items; summary: 3 items; currency: "฿")
```

**admin off** (run 1 of 2) — pass · no judge · tools: open_order, spec · 32596 ms

Text: I'll open the order to see its details.


Here's order **C-1042** at a glance:

- **Customer:** Napat Srisuwan (Bangkok)
- **Status:** pending
- **Total:** ฿2,070
- **Items:** Ceramic pour-over set ×1 (฿1,290), Single-origin beans 250g ×2 (฿390 each)
- **Timeline:** placed 2026-09-20 09:00 — no payment or shipping events yet

```
Stack(direction: "vertical"; gap: "md")
  Card(title: "Order C-1042"; description: "Napat Srisuwan · Bangkok")
    Badge(label: "Pending"; tone: "warning")
    KeyValue(pairs: 4 items; size: "md")
  Card(title: "Items (2 lines)")
    LineItems(items: 2 items; summary: 1 items; currency: "฿")
  Card(title: "Timeline")
    Timeline(items: 1 items)
```

### note-form — ui · `/orders/C-1042`

> Make a small form where I can add a note to this order

**admin on** (run 1 of 2) — fail (invalid spec: /elements/note-input/children Invalid input: expected array, received undefined) · no judge · tools: none · 7877 ms

Text: Here's a compact note form for order C-1042 — type your note and press "Add note".

```
Card(title: "Add a note to C-1042"; description: "Internal note visible to you and the sup…")
  Input(label: "Note"; name: "orderNote"; inputType: "textarea"; placeholder: "e.g. Customer requested extra packaging …")
  Button(label: "Add note"; variant: "primary")
```

Validation: /elements/note-input/children Invalid input: expected array, received undefined; /elements/add-btn/children Invalid input: expected array, received undefined

**admin off** (run 1 of 2) — fail (invalid spec: /elements/note-input/children Invalid input: expected array, received undefined) · no judge · tools: none · 10439 ms

Text: Here's a compact note form for order C-1042 — type your note and press the button to save it.

```
Card(title: "Add note to order C-1042"; description: "Internal note visible to the shop team o…")
  Input(label: "Note"; name: "note"; placeholder: "e.g. Customer requested extra filters"; inputType: "textarea")
  Button(label: "Save note"; variant: "primary")
  Text(content: "Note saved."; muted: true)
```

Validation: /elements/note-input/children Invalid input: expected array, received undefined

### revenue-by-status — ui · `/`

> Compare revenue by status

**admin on** (run 1 of 2) — fail (invalid spec: /elements/m-total/children Invalid input: expected array, received undefined; delivered shows 16850, data says 14930) · no judge · tools: get_orders, get_orders, get_orders, get_orders, admin_observe, admin_run · 52542 ms

Other failing runs: run 2: no spec

Text: Here's revenue by status across all 24 orders on the Orders page (order totals as listed; refunded amounts are gross, not netted back).



Highlights: delivered orders dominate at $16,850 (11 orders), followed by shipped $7,170 (4), pending $5,510 (4), paid $4,150 (3), and $2,590 across 2 refunded orders. Note the data tools errored, so these figures come from reading the full 24-row orders table directly.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Revenue by order status"; level: "2")
  BarChart(title: "Gross order value by status (USD)"; labels: 5 items; series: 1 items; horizontal: true)
  Grid(columns: "3"; gap: "sm")
    Metric(label: "Total gross revenue"; value: "$36,270"; detail: "Across 24 orders")
    Metric(label: "Orders with money in play"; value: "21"; detail: "Excludes 3 refunded orders")
    Metric(label: "Largest bucket"; value: "Delivered"; detail: "$16,850 · 46% of gross")
  KeyValue(pairs: 5 items; size: "md")
```

Validation: /elements/m-total/children Invalid input: expected array, received undefined; /elements/m-count/children Invalid input: expected array, received undefined; /elements/m-avg/children Invalid input: expected array, received undefined

**admin off** (run 1 of 2) — fail (no spec) · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders, get_orders · 12778 ms

Other failing runs: run 2: no spec

Text: (none)

```
(no spec)
```

Validation: / Spec is empty

### chiang-mai-orders — ui · `/orders`

> List the Chiang Mai orders with their totals

**admin on** (run 1 of 2) — fail (no spec) · no judge · tools: set_filter, set_filter · 7159 ms

Other failing runs: run 2: no spec

Text: I've filtered the orders table to Chiang Mai — 5 orders match:

| Order | Customer | Status | Total |
|---|---|---|---|
| C-1041 | Ploy Chaiyaporn | paid | ฿1,020 |
| C-1036 | Arthit Wongsa | delivered | ฿990 |
| C-1031 | Sara Kim | pending | ฿1,960 |
| C-1026 | Dao Phromma | refunded | ฿1,890 |
| C-1021 | Nok Sirikarn | delivered | ฿1,120 |

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — pass · no judge · tools: set_filter · 9917 ms

Text: Filtered the orders table to Chiang Mai — 5 orders match.

```
Card(title: "Chiang Mai orders"; description: "5 orders as of 2026-09-21")
  Table(columns: 4 items; rows: 5 items)
  Row(gap: "lg"; align: "center"; wrap: true)
    m1 (missing)
    m2 (missing)
    m3 (missing)
```

### show-and-open — hybrid · `/`

> Show pending orders in the chat and open the first one on the page

**admin on** (run 1 of 2) — pass · no judge · tools: get_orders, get_orders, get_orders, get_orders, set_filter, open_order · 22617 ms

Text: Found 4 pending orders and opened the first one (C-1042) on the page.



The table above lists all four pending orders; the page is now showing C-1042's detail with its two line items.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Pending orders (4)"; level: "2")
  Table(columns: 4 items; rows: 4 items)
  Card(title: "Opened: C-1042 — Napat Srisuwan (Bangkok…"; description: "Placed 2026-09-20, pending, total 2,070 …")
    LineItems(items: 2 items; summary: 1 items; currency: "฿")
```

**admin off** (run 1 of 2) — pass · no judge · tools: set_filter, open_order · 15130 ms

Other failing runs: run 2: no spec

Text: Here are the 4 pending orders; I've opened C-1042 on the page for you.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Pending orders (4)"; level: "2")
  Table(columns: 4 items; rows: 4 items)
  Card(title: "Opened: C-1042 — Napat Srisuwan (Bangkok…"; description: "Placed 2026-09-20, pending")
    LineItems(items: 2 items; summary: 1 items; currency: "฿")
    Badge(label: "Pending"; tone: "warning")
```

### settings-question — question · `/settings`

> What can I change on this page?

**admin on** (run 1 of 2) — pass · no judge · tools: admin_observe · 9015 ms

Text: I'll take a look at your settings page to see what's available.


Here's what you can change on the Settings page:

**Theme** — switch between light and dark for the whole admin.

**Locale and currency** — pick a locale (en-US or de-DE) and a currency (USD or EUR); this affects how every number on screen is displayed.

**Chat** — choose how my steps are shown: collapsible or hidden.

**Assistant → Host tools** — turn my ability to operate the admin pages (navigate, filter, op…

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — pass · no judge · tools: navigate · 7925 ms

Text: I can see you're on the settings page, but I don't have a tool that reads what's actually rendered there — let me check the app's guides for what the settings page covers.


Here's what you can change from Settings, based on the controls I do have:

- **Theme** — switch the admin between light and dark.
- **Locale & currency** — pick `en-US` or `de-DE` with USD, or `de-DE` with EUR; this affects how every number on screen is formatted.

Two things worth flagging honestly: I h…

```
(no spec)
```

Validation: / Spec is empty

### add-product — drive · `/products`

> Add a new product: Winter mug, SKU WM-1, $14, Merch, active

**admin on** (run 1 of 2) — pass · no judge · tools: admin_observe, admin_run, admin_run, admin_run · 12834 ms

Text: I'll add the Winter mug on the products page. Let me look at the page first.


Done — Winter mug (SKU WM-1, $14, Merch, active) is created, and the products table now shows 10 rows.

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — fail (missing tool admin_run) · no judge · tools: navigate · 16131 ms

Other failing runs: run 2: missing tool admin_run

Text: I'll add the Winter mug to the catalog by operating the product pages directly — opening the products page and using its "add product" flow.


I'm on the products page, but I don't have tools for creating products — and this page's UI doesn't expose one to me directly. Let me build a small form so you can add it in one click with the values pre-filled.



To be straight with you: my toolset covers orders (list, open, status, refund), supplier notes, room bookings, and page/th…

```
Card(title: "Add new product"; description: "Values pre-filled from your request — re…")
  Stack(direction: "vertical"; gap: "md")
    Input(label: "Product name"; name: "name"; placeholder: "Winter mug")
    Input(label: "SKU"; name: "sku"; placeholder: "WM-1")
    Input(label: "Price (USD)"; name: "price"; placeholder: "14"; inputType: "number")
    Select(label: "Category"; name: "category"; placeholder: "Choose a category"; options: 4 items)
    Switch(label: "Active"; name: "active"; hint: "Visible in the storefront immediately")
    Row(gap: "sm"; align: "center")
      Button(label: "Create product"; variant: "primary")
    Text(content: "Note: I can navigate and filter the admi…"; muted: true)
```

### week-dashboard — ui · `/`

> Give me a dashboard for this week

**admin on** (run 1 of 2) — fail (no spec; Stopped after 6 round trips) · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, set_filter, select_order, select_order, set_filter, set_filter, set_filter · 27904 ms

Other failing runs: run 2: no spec

Text: I'll pull this week's orders to build the dashboard with real numbers.

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — fail (no spec) · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders, get_orders · 11618 ms

Text: (none)

```
(no spec)
```

Validation: / Spec is empty

