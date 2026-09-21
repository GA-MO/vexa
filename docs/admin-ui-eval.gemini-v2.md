# Generative UI with admin on and off — gemini-v2

Ten real-user prompts on the shop admin, each run 2 times per mode with `gemini-3.1-flash-lite` (2026-09-21). "on" = `admin: true` on the server and the `admin_*` host tools sent by the client, as shop-admin ships; "off" = `VEXA_ADMIN=off` and no admin descriptors. The shop's own host tools are registered in both modes.

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
| pending-orders | ui | 2/2 · judge — · spec 2/2 · detours 1 · 10.7 s | 2/2 · judge — · spec 2/2 · detours 0 · 11.9 s |
| city-chart | ui | 0/2 · judge — · spec 1/2 · detours 1 · 24.0 s | 2/2 · judge — · spec 2/2 · detours 0 · 17.5 s |
| order-summary | ui | 2/2 · judge — · spec 2/2 · detours 0 · 9.3 s | 2/2 · judge — · spec 2/2 · detours 0 · 7.1 s |
| note-form | ui | 2/2 · judge — · spec 2/2 · detours 0 · 158.3 s | 2/2 · judge — · spec 2/2 · detours 0 · 6.7 s |
| revenue-by-status | ui | 0/2 · judge — · spec 1/2 · detours 1 · 24.8 s | 0/2 · judge — · spec 1/2 · detours 0 · 20.5 s |
| chiang-mai-orders | ui | 2/2 · judge — · spec 2/2 · detours 0 · 12.1 s | 1/2 · judge — · spec 2/2 · detours 0 · 5.9 s |
| show-and-open | hybrid | 2/2 · judge — · spec 2/2 · 11.8 s | 2/2 · judge — · spec 2/2 · 12.6 s |
| settings-question | question | 2/2 · judge — · spec 0/2 · 7.8 s | 2/2 · judge — · spec 2/2 · 6.8 s |
| add-product | drive | 2/2 · judge — · spec 0/2 · 38.3 s | 0/2 · judge — · spec 1/2 · 5.2 s |
| week-dashboard | ui | 1/2 · judge — · spec 2/2 · detours 0 · 11.1 s | 1/2 · judge — · spec 2/2 · detours 0 · 24.5 s |

Cells: correct/runs · judge mean (min–max) · runs with a spec · admin detours (ui cases) · median latency.

## Cases

### pending-orders — ui · `/`

> Show me the pending orders

**admin on** (run 1 of 2) — pass · no judge · tools: set_filter · 9574 ms

Text: I have found 4 pending orders for you.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Pending Orders")
  Table(columns: 4 items)
```

**admin off** (run 1 of 2) — pass · no judge · tools: set_filter · 15919 ms

Text: I've retrieved the pending orders for you. Here are the 4 currently outstanding orders:

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Pending Orders"; level: "2")
  Table(columns: 4 items)
```

### city-chart — ui · `/`

> Which city has the most orders? Show it as a chart

**admin on** (run 1 of 2) — fail (Bangkok shows 5, data says 10; Chiang Mai shows 2, data says 5; Phuket shows 2, data says 5; Khon Kaen shows 2, data says 4) · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders · 10371 ms

Other failing runs: run 2: no spec; Stopped after 6 round trips

Text: Bangkok has the highest number of orders among all cities served by Vexa Shop, with 5 completed orders.

```
Card(title: "Orders by City")
  BarChart(title: "Delivered Orders"; labels: 4 items; series: 1 items; horizontal: true)
```

**admin off** (run 1 of 2) — pass · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders · 10118 ms

Text: Bangkok currently has the highest number of paid orders with a total of 2.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Paid Orders by City"; level: "2")
  BarChart(title: "Paid Orders"; series: 1 items; horizontal: true)
```

### order-summary — ui · `/orders/C-1042`

> Give me a summary of this order

**admin on** (run 1 of 2) — pass · no judge · tools: open_order · 8513 ms

Text: This order is for Napat Srisuwan in Bangkok. It includes one ceramic pour-over set and two bags of single-origin beans, totaling 2070.

```
Stack(direction: "vertical"; gap: "md")
  Card(title: "Order C-1042 Summary")
    KeyValue(pairs: 3 items)
    LineItems(items: 2 items; summary: 1 items)
```

**admin off** (run 1 of 2) — pass · no judge · tools: open_order · 6702 ms

Text: This order (C-1042) is for Napat Srisuwan in Bangkok, currently in pending status. It contains one ceramic pour-over set and two bags of single-origin beans, totaling 2070 THB.

```
Stack(direction: "vertical"; gap: "md")
  Card(title: "Order Details")
    KeyValue(pairs: 3 items)
  Card(title: "Items")
    LineItems(items: 2 items; summary: 1 items; currency: "THB")
```

### note-form — ui · `/orders/C-1042`

> Make a small form where I can add a note to this order

**admin on** (run 1 of 2) — pass · no judge · tools: open_order · 7292 ms

Text: You can add a note to order C-1042 using the form below.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Add Order Note"; level: "2")
  Input(label: "Note"; name: "note"; inputType: "textarea"; placeholder: "Add your instructions or comments here..…")
  Button(label: "Save Note"; variant: "primary")
```

**admin off** (run 1 of 2) — pass · no judge · tools: open_order · 8125 ms

Text: Certainly! Here is a simple form you can use to add a note to order C-1042.

```
Card(title: "Add Order Note")
  Stack(direction: "vertical"; gap: "md")
    Input(label: "Note"; name: "note"; inputType: "textarea"; placeholder: "Add your internal note here...")
    Button(label: "Save Note"; variant: "primary")
```

### revenue-by-status — ui · `/`

> Compare revenue by status

**admin on** (run 1 of 2) — fail (pending shows 3230, data says 5510; paid shows 2590, data says 4150; shipped shows 4140, data says 7170; delivered shows 3130, data says 14930; refunded shows 700, data says 2590) · no judge · tools: set_filter, get_orders, get_orders, get_orders, get_orders, get_orders, set_filter, admin_discover · 20383 ms

Other failing runs: run 2: no spec

Text: Here is a summary of revenue categorized by order status based on the current data.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Revenue by Order Status"; level: "2")
  BarChart(title: "Total Revenue (THB)"; labels: 5 items; series: 1 items)
```

**admin off** (run 1 of 2) — fail (pending shows 3230, data says 5510; paid shows 3130, data says 4150; shipped shows 1890, data says 7170; delivered shows 8190, data says 14930; chart lacks refunded) · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders, get_orders · 20450 ms

Other failing runs: run 2: no spec

Text: Here is the current revenue breakdown by order status for Bangkok customers.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Revenue by Order Status (Bangkok)"; level: "2")
  BarChart(title: "Revenue by Status"; labels: 4 items; series: 1 items; horizontal: true)
```

### chiang-mai-orders — ui · `/orders`

> List the Chiang Mai orders with their totals

**admin on** (run 1 of 2) — pass · no judge · tools: set_filter · 12996 ms

Text: I have found 5 orders for Chiang Mai. Here are their details:

```
Card(title: "Orders in Chiang Mai")
  Table(columns: 4 items)
```

**admin off** (run 1 of 2) — pass · no judge · tools: set_filter · 5677 ms

Other failing runs: run 2: Chiang Mai rows missing C-1041, C-1036, C-1031, C-1026, C-1021

Text: I've found 5 orders for Chiang Mai. Here are their details:

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Orders in Chiang Mai"; level: "2")
  Table(columns: 4 items; rows: 5 items)
```

### show-and-open — hybrid · `/`

> Show pending orders in the chat and open the first one on the page

**admin on** (run 1 of 2) — pass · no judge · tools: set_filter, open_order · 10143 ms

Text: I have found 4 pending orders. I've opened the first one, C-1042, for you.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Pending Orders"; level: "2")
  Table(columns: 4 items)
```

**admin off** (run 1 of 2) — pass · no judge · tools: set_filter, open_order · 11622 ms

Text: I've filtered for pending orders and opened the first one, C-1042 for Napat Srisuwan, on the dashboard.

```
Stack(direction: "vertical"; gap: "md")
  Heading(text: "Pending Orders"; level: "2")
  Table(columns: 4 items)
```

### settings-question — question · `/settings`

> What can I change on this page?

**admin on** (run 1 of 2) — pass · no judge · tools: admin_observe · 7905 ms

Text: On the Settings page, you can customize your experience by switching between light and dark themes, selecting your preferred locale (English or German) and currency (USD or EUR), adjusting the display of chat steps, and toggling host tool availability for the assistant.

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — pass · no judge · tools: none · 7968 ms

Text: On the settings page, you can customize your experience by switching between light and dark themes, or by updating your display language and preferred currency (USD or EUR).

```
Stack(direction: "vertical"; gap: "lg")
  Card(title: "Theme"; description: "Switch between light and dark modes")
    Stack(direction: "horizontal"; gap: "md")
      Button(label: "Light Theme"; variant: "secondary")
      Button(label: "Dark Theme"; variant: "secondary")
  Card(title: "Regional Settings"; description: "Set your language and currency preferenc…")
    Stack(direction: "vertical"; gap: "md")
      Select(label: "Language"; name: "locale"; options: 2 items)
      Select(label: "Currency"; name: "currency"; options: 2 items)
      Button(label: "Save Changes"; variant: "primary")
```

### add-product — drive · `/products`

> Add a new product: Winter mug, SKU WM-1, $14, Merch, active

**admin on** (run 1 of 2) — pass · no judge · tools: admin_run · 37496 ms

Text: I'm sorry, I encountered a navigation error while trying to add the "Winter mug" product. It seems I couldn't access the creation page at this time—could you please try again, or check if the page is currently available?

```
(no spec)
```

Validation: / Spec is empty

**admin off** (run 1 of 2) — fail (missing tool admin_run) · no judge · tools: runTool · 6361 ms

Other failing runs: run 2: missing tool admin_run; no mention of /Winter mug/i

Text: I've added the "Winter mug" to your product catalog as requested.

```
Card(title: "New Product Added")
  KeyValue(pairs: 5 items)
```

### week-dashboard — ui · `/`

> Give me a dashboard for this week

**admin on** (run 1 of 2) — pass · no judge · tools: set_filter · 6932 ms

Other failing runs: run 2: no metric equals a real aggregate (orders this week 8; revenue this week (paid) 6870; revenue this week (all) 10800; pending this week 2; orders total 24; revenue total 26250; pending total 4)

Text: Here is an overview of your shop's performance for this week based on recent orders.

```
Stack(direction: "vertical"; gap: "md")
  Grid(columns: "3"; gap: "md")
    Metric(label: "Revenue"; value: "$13,790"; detail: "This week"; trend: "up")
    Metric(label: "Orders"; value: "24"; detail: "Total volume")
    Metric(label: "Pending"; value: "2"; detail: "Needs attention"; trend: "neutral")
  BarChart(title: "Orders by City"; labels: 4 items; series: 1 items; horizontal: true)
```

**admin off** (run 1 of 2) — pass · no judge · tools: get_orders, get_orders, get_orders, get_orders, get_orders · 17397 ms

Other failing runs: run 2: no metric equals a real aggregate (orders this week 8; revenue this week (paid) 6870; revenue this week (all) 10800; pending this week 2; orders total 24; revenue total 26250; pending total 4)

Text: Here is your dashboard summary for the recent paid orders across our locations.

```
Stack(direction: "vertical"; gap: "lg")
  Heading(text: "Weekly Overview (Sept 14-21)"; level: "1")
  Grid(columns: "3"; gap: "md")
    Metric(label: "Total Revenue"; value: "2590 THB")
    Metric(label: "Recent Orders"; value: "2")
    Metric(label: "Avg Order Value"; value: "1295 THB")
  BarChart(title: "Paid Orders by City"; labels: 2 items; series: 1 items)
```

