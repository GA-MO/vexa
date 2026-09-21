import type { Spec } from "vexa/protocol";
import { CITIES, ORDERS, STATUSES, findOrder, metrics, totals, type Order } from "@/lib/shop/data";
import { chartSeries, containsNumber, elementsOfType, idsIn, labelledValues, numbersIn, sameSet, specText, tableRows } from "./spec-read";

export type EvalKind = "ui" | "drive" | "hybrid" | "question";

/** What a real-user prompt must produce. A `|` inside a component or tool name lists alternatives. */
export type EvalExpectation = {
  components?: string[];
  mentions?: RegExp[];
  tools?: string[];
  noSpec?: boolean;
  minElements?: number;
};

export type EvalData = { orders: Order[] };

/** Returns the correctness failures of a reply against the shop data: an empty list is a correct answer. */
export type Verify = (spec: Spec | null, text: string, data: EvalData) => string[];

export type EvalCase = {
  id: string;
  page: string;
  prompt: string;
  kind: EvalKind;
  expect: EvalExpectation;
  verify?: Verify;
};

const CHART = "Chart|BarChart|LineChart";
const ORDER_ID = /C-\d{4}/g;
const DAY_MS = 24 * 60 * 60 * 1000;

function idsOf(orders: Order[]): Set<string> {
  return new Set(orders.map((order) => order.id));
}

function needSpec(spec: Spec | null): string[] {
  return spec ? [] : ["no spec"];
}

function rowIdsMatch(spec: Spec, expected: Set<string>, what: string): string[] {
  const rows = tableRows(spec);
  if (rows.length === 0) return ["no table rows"];
  const actual = idsIn(rows.map((row) => row.join(" ")).join("\n"), ORDER_ID);
  const diff = sameSet(actual, expected);
  const failures: string[] = [];
  if (diff.missing.length > 0) failures.push(`${what} rows missing ${diff.missing.join(", ")}`);
  if (diff.extra.length > 0) failures.push(`${what} rows include ${diff.extra.join(", ")}`);
  return failures;
}

function countByCity(orders: Order[]): Map<string, number> {
  return new Map(CITIES.map((city) => [city, orders.filter((order) => order.city === city).length]));
}

function revenueByStatus(orders: Order[]): Map<string, number> {
  return new Map(STATUSES.map((status) => [status, orders.filter((order) => order.status === status).reduce((sum, order) => sum + totals(order).total, 0)]));
}

function chartValuesMatch(spec: Spec, expected: Map<string, number>, tolerance: number): string[] {
  const series = chartSeries(spec);
  if (series.length === 0) return ["no chart series"];
  const failures: string[] = [];
  const seen = new Set<string>();
  for (const { labels, values } of series) {
    labels.forEach((label, index) => {
      const key = [...expected.keys()].find((candidate) => label.toLowerCase().includes(candidate.toLowerCase()));
      if (!key) return;
      seen.add(key);
      const wanted = expected.get(key) ?? 0;
      if (Math.abs(values[index] - wanted) > tolerance) failures.push(`${key} shows ${values[index]}, data says ${wanted}`);
    });
  }
  const missing = [...expected.keys()].filter((key) => !seen.has(key));
  if (missing.length > 0) failures.push(`chart lacks ${missing.join(", ")}`);
  return failures;
}

function weekAggregates(orders: Order[]): Array<{ label: string; value: number }> {
  const since = Date.now() - 7 * DAY_MS;
  const thisWeek = orders.filter((order) => Date.parse(order.createdAt) >= since);
  const paidThisWeek = thisWeek.filter((order) => order.status !== "pending" && order.status !== "refunded");
  const all = metrics(orders);
  return [
    { label: "orders this week", value: thisWeek.length },
    { label: "revenue this week (paid)", value: paidThisWeek.reduce((sum, order) => sum + totals(order).total, 0) },
    { label: "revenue this week (all)", value: thisWeek.reduce((sum, order) => sum + totals(order).total, 0) },
    { label: "pending this week", value: thisWeek.filter((order) => order.status === "pending").length },
    { label: "orders total", value: all.orderCount },
    { label: "revenue total", value: all.revenue },
    { label: "pending total", value: all.pendingCount },
  ];
}

const verifyPendingTable: Verify = (spec, _text, data) => spec ? rowIdsMatch(spec, idsOf(data.orders.filter((order) => order.status === "pending")), "pending") : needSpec(spec);

const verifyCityChart: Verify = (spec, _text, data) => (spec ? chartValuesMatch(spec, countByCity(data.orders), 0) : needSpec(spec));

const verifyOrderSummary: Verify = (spec, text, data) => {
  if (!spec) return needSpec(spec);
  const order = findOrder(data.orders, "C-1042");
  if (!order) return ["C-1042 missing from data"];
  const haystack = `${specText(spec)}\n${text}`;
  const failures: string[] = [];
  if (!haystack.includes("C-1042")) failures.push("order id absent");
  if (!containsNumber(haystack, totals(order).total)) failures.push(`total ${totals(order).total} absent`);
  if (!new RegExp(order.status, "i").test(haystack)) failures.push(`status ${order.status} absent`);
  return failures;
};

const verifyNoteForm: Verify = (spec) => {
  if (!spec) return needSpec(spec);
  const failures: string[] = [];
  if (elementsOfType(spec, ["Input", "Textarea"]).length === 0) failures.push("no input field");
  if (elementsOfType(spec, ["Button"]).length === 0) failures.push("no button");
  return failures;
};

const verifyRevenueByStatus: Verify = (spec, _text, data) => {
  if (!spec) return needSpec(spec);
  const expected = revenueByStatus(data.orders);
  const fromChart = chartValuesMatch(spec, expected, 1);
  if (fromChart.length === 0) return [];
  const values = labelledValues(spec);
  const missing = [...expected.entries()].filter(([status, amount]) => !values.some((entry) => entry.label.toLowerCase().includes(status) && containsNumber(entry.value, amount, 1)));
  return missing.length === 0 ? [] : fromChart;
};

const verifyChiangMai: Verify = (spec, _text, data) => {
  if (!spec) return needSpec(spec);
  const orders = data.orders.filter((order) => order.city === "Chiang Mai");
  const failures = rowIdsMatch(spec, idsOf(orders), "Chiang Mai");
  const rows = tableRows(spec).map((row) => row.join(" "));
  for (const order of orders) {
    const row = rows.find((candidate) => candidate.includes(order.id));
    if (row && !containsNumber(row, totals(order).total)) failures.push(`${order.id} total ${totals(order).total} not in its row`);
  }
  return failures;
};

const verifyWeekDashboard: Verify = (spec, _text, data) => {
  if (!spec) return needSpec(spec);
  const aggregates = weekAggregates(data.orders);
  const shown = labelledValues(spec).flatMap((entry) => numbersIn(entry.value));
  const matched = aggregates.filter((aggregate) => shown.some((value) => Math.abs(value - aggregate.value) <= 0.5));
  if (elementsOfType(spec, ["Metric", "Chart", "BarChart", "LineChart"]).length === 0) return ["no metric or chart"];
  return matched.length > 0 ? [] : [`no metric equals a real aggregate (${aggregates.map((item) => `${item.label} ${item.value}`).join("; ")})`];
};

export const EVAL_DATA: EvalData = { orders: ORDERS };

export const EVAL_CASES: EvalCase[] = [
  { id: "pending-orders", page: "/", prompt: "Show me the pending orders", kind: "ui", expect: { components: ["Table"] }, verify: verifyPendingTable },
  { id: "city-chart", page: "/", prompt: "Which city has the most orders? Show it as a chart", kind: "ui", expect: { components: [CHART] }, verify: verifyCityChart },
  { id: "order-summary", page: "/orders/C-1042", prompt: "Give me a summary of this order", kind: "ui", expect: { components: ["Card|Metric|KeyValue|LineItems"] }, verify: verifyOrderSummary },
  { id: "note-form", page: "/orders/C-1042", prompt: "Make a small form where I can add a note to this order", kind: "ui", expect: { components: ["Input", "Button"] }, verify: verifyNoteForm },
  { id: "revenue-by-status", page: "/", prompt: "Compare revenue by status", kind: "ui", expect: { components: [CHART] }, verify: verifyRevenueByStatus },
  { id: "chiang-mai-orders", page: "/orders", prompt: "List the Chiang Mai orders with their totals", kind: "ui", expect: { components: ["Table"] }, verify: verifyChiangMai },
  { id: "show-and-open", page: "/", prompt: "Show pending orders in the chat and open the first one on the page", kind: "hybrid", expect: { components: ["Table"], tools: ["open_order|admin_run|navigate"] }, verify: verifyPendingTable },
  { id: "settings-question", page: "/settings", prompt: "What can I change on this page?", kind: "question", expect: { mentions: [/theme|locale|currency|steps/i], noSpec: true } },
  { id: "add-product", page: "/products", prompt: "Add a new product: Winter mug, SKU WM-1, $14, Merch, active", kind: "drive", expect: { tools: ["admin_run"], mentions: [/Winter mug/i], noSpec: true } },
  { id: "week-dashboard", page: "/", prompt: "Give me a dashboard for this week", kind: "ui", expect: { components: [`${CHART}|Metric`], minElements: 2 }, verify: verifyWeekDashboard },
];
