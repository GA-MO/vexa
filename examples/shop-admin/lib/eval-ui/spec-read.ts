import type { Spec } from "vexa/protocol";

export type ChartData = { labels: string[]; values: number[] };

type Element = Spec["elements"][string];

const STATE_BINDING_KEYS = ["$state", "$bindState"] as const;

function statePathOf(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  for (const key of STATE_BINDING_KEYS) {
    const path = (value as Record<string, unknown>)[key];
    if (typeof path === "string") return path;
  }
  return null;
}

function readStatePath(state: Record<string, unknown> | null | undefined, path: string): unknown {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  return segments.reduce<unknown>((current, segment) => (typeof current === "object" && current !== null ? (current as Record<string, unknown>)[segment] : undefined), state ?? {});
}

/** A prop as the renderer sees it: a `{ $state: "/path" }` binding is replaced by the value at that path in the spec's initial state. */
function resolveProp(spec: Spec, value: unknown): unknown {
  const path = statePathOf(value);
  return path === null ? value : readStatePath(spec.state, path);
}

function propsOf(spec: Spec, element: Element): Record<string, unknown> {
  const props = (element.props ?? {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(props).map(([key, value]) => [key, resolveProp(spec, value)]));
}

export function elementsOfType(spec: Spec, types: string[]): Element[] {
  return Object.values(spec.elements).filter((element) => types.includes(element.type));
}

function recordValues(rows: unknown): Array<Array<string | number>> {
  return Array.isArray(rows) ? rows.map((row) => Object.values(row as Record<string, string | number>)) : [];
}

function repeatedItems(spec: Spec): Array<Array<string | number>> {
  return Object.values(spec.elements).flatMap((element) => {
    const statePath = (element as { repeat?: { statePath?: unknown } }).repeat?.statePath;
    return typeof statePath === "string" ? recordValues(readStatePath(spec.state, statePath)) : [];
  });
}

/** Every record the spec lists: the rows of every Table plus the items of every `repeat` over state, each as its values. */
export function tableRows(spec: Spec): Array<Array<string | number>> {
  const rows = elementsOfType(spec, ["Table"]).flatMap((table) => recordValues(propsOf(spec, table).rows));
  return [...rows, ...repeatedItems(spec)];
}

function pointsToChart(points: unknown): ChartData | null {
  if (!Array.isArray(points)) return null;
  const labels = points.map((point) => String((point as { label?: unknown }).label ?? ""));
  const values = points.map((point) => Number((point as { value?: unknown }).value));
  return { labels, values };
}

function seriesToChart(props: Record<string, unknown>): ChartData[] {
  const labels = Array.isArray(props.labels) ? props.labels.map(String) : [];
  const series = Array.isArray(props.series) ? props.series : [];
  return series.map((entry) => ({ labels, values: (Array.isArray((entry as { values?: unknown }).values) ? (entry as { values: unknown[] }).values : []).map(Number) }));
}

/** Every series of every chart (Chart points, BarChart / LineChart series) as label → value pairs. */
export function chartSeries(spec: Spec): ChartData[] {
  return elementsOfType(spec, ["Chart", "BarChart", "LineChart"]).flatMap((chart) => {
    const props = propsOf(spec, chart);
    if (chart.type === "Chart") {
      const data = pointsToChart(props.points);
      return data ? [data] : [];
    }
    return seriesToChart(props);
  });
}

/** Label → value of every Metric and every KeyValue pair. */
export function labelledValues(spec: Spec): Array<{ label: string; value: string }> {
  const metrics = elementsOfType(spec, ["Metric"]).map((metric) => ({ label: String(propsOf(spec, metric).label ?? ""), value: String(propsOf(spec, metric).value ?? "") }));
  const pairs = elementsOfType(spec, ["KeyValue"]).flatMap((keyValue) => {
    const entries = propsOf(spec, keyValue).pairs;
    return Array.isArray(entries) ? entries.map((pair) => ({ label: String((pair as { label?: unknown }).label ?? ""), value: String((pair as { value?: unknown }).value ?? "") })) : [];
  });
  return [...metrics, ...pairs];
}

function stringsIn(value: unknown, out: string[]) {
  if (typeof value === "string") out.push(value);
  else if (typeof value === "number") out.push(String(value));
  else if (Array.isArray(value)) for (const item of value) stringsIn(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) stringsIn(item, out);
}

/** Every string and number anywhere in the spec's props, joined with newlines. */
export function specText(spec: Spec): string {
  const out: string[] = [];
  for (const element of Object.values(spec.elements)) stringsIn(propsOf(spec, element), out);
  return out.join("\n");
}

const NUMBER = /-?\d[\d,]*(?:\.\d+)?/g;

/** Every number written in a string, with thousands separators removed ("$2,070.00" → 2070). */
export function numbersIn(text: string): number[] {
  return (text.match(NUMBER) ?? []).map((token) => Number(token.replace(/,/g, ""))).filter((value) => Number.isFinite(value));
}

export function containsNumber(text: string, wanted: number, tolerance = 0.5): boolean {
  return numbersIn(text).some((value) => Math.abs(value - wanted) <= tolerance);
}

export function idsIn(text: string, pattern: RegExp): Set<string> {
  return new Set(text.match(pattern) ?? []);
}

export function sameSet(actual: Set<string>, expected: Set<string>): { missing: string[]; extra: string[] } {
  return {
    missing: [...expected].filter((id) => !actual.has(id)),
    extra: [...actual].filter((id) => !expected.has(id)),
  };
}
