import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { LanguageModel, UIMessage } from "ai";
import { normalizeSpec } from "vexa/core";
import { evaluateSpec } from "vexa/eval";
import type { Spec } from "vexa/protocol";
import { EVAL_CASES, EVAL_DATA, type EvalCase, type EvalExpectation } from "@/lib/eval-ui/cases";
import { JUDGE_SCORE_MAX, judgeReply, judgeTotal, type JudgeScore } from "@/lib/eval-ui/judge";
import { componentsOf, specOf, specTree } from "@/lib/eval-ui/reply";
import { evalShopTools, shopHostToolDescriptors } from "@/lib/eval-ui/shop-tools";
import { demoModels, demoProviderOptions } from "@/lib/models";
import { createDomPageHost } from "@/lib/scenarios/dom-host";
import { createHeadlessHost } from "@/lib/scenarios/driver";
import { BASE_URL, MODEL, lastAssistantMessage, sendUserMessage, type ChatSession } from "@/lib/scenarios/model-turn";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

type Mode = "on" | "off";

type RunRecord = {
  run: number;
  pass: boolean;
  failures: string[];
  correctness: string[];
  judge: JudgeScore | null;
  hasSpec: boolean;
  specValid: boolean;
  specIssues: string[];
  components: string[];
  elementCount: number;
  tools: string[];
  text: string;
  latencyMs: number;
  spec: Spec | null;
  errors: string[];
};

type ModeResults = { ranAt: string; model: string; cases: Record<string, RunRecord[]> };

type ResultsFile = { modes: Partial<Record<Mode, ModeResults>> };

const LABEL = process.env.VEXA_EVAL_LABEL ?? "";
const LABEL_SUFFIX = LABEL ? `.${LABEL}` : "";
const RESULTS_DIR = new URL("../", import.meta.url);
const RESULTS_PATH = fileURLToPath(new URL(`../.eval-ui${LABEL_SUFFIX}.json`, import.meta.url));
const REPORT_PATH = fileURLToPath(new URL(`../../../docs/admin-ui-eval${LABEL_SUFFIX}.md`, import.meta.url));
const SUMMARY_REPORT_PATH = fileURLToPath(new URL("../../../docs/admin-ui-eval.md", import.meta.url));
const FIXTURE_PATH = fileURLToPath(new URL("../lib/eval-ui/specs.ts", import.meta.url));
const DEFAULT_RUNS = 5;
const DEFAULT_PACE_MS = 2_000;
const TEXT_PREVIEW = 160;
const QUOTA_RETRY_LIMIT = 3;
const QUOTA_COOLDOWN_MS = 65_000;
const UI_CASES = EVAL_CASES.filter((evalCase) => evalCase.kind === "ui").map((evalCase) => evalCase.id);

function parseArgs(argv: string[]) {
  const mode = (argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] ?? "on") as Mode;
  const runs = Number(argv.find((arg) => arg.startsWith("--runs="))?.split("=")[1] ?? DEFAULT_RUNS);
  const report = argv.includes("--report");
  const noJudge = argv.includes("--no-judge");
  const paceMs = Number(argv.find((arg) => arg.startsWith("--pace="))?.split("=")[1] ?? DEFAULT_PACE_MS);
  const rescore = argv.includes("--rescore");
  const ids = argv.filter((arg) => !arg.startsWith("--"));
  return { mode, runs, report, noJudge, paceMs, rescore, ids };
}

function hitQuota(record: RunRecord) {
  return record.errors.some((error) => /quota|429|rate limit|An error occurred/i.test(error));
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesAny(expected: string, actual: string[]) {
  return expected.split("|").some((option) => actual.includes(option));
}

function presenceFailures(expect: EvalExpectation, record: Pick<RunRecord, "text" | "spec" | "hasSpec" | "components" | "tools" | "elementCount">): string[] {
  const failures: string[] = [];
  const haystack = `${record.text}\n${JSON.stringify(record.spec ?? {})}`;
  if (!expect.noSpec && !record.hasSpec) failures.push("no spec");
  for (const component of expect.components ?? []) if (!matchesAny(component, record.components)) failures.push(`missing ${component}`);
  for (const tool of expect.tools ?? []) if (!matchesAny(tool, record.tools)) failures.push(`missing tool ${tool}`);
  for (const pattern of expect.mentions ?? []) if (!pattern.test(haystack)) failures.push(`no mention of ${pattern}`);
  if (expect.minElements && record.elementCount < expect.minElements) failures.push(`only ${record.elementCount} elements`);
  return failures;
}

/** A ui case passes on correctness against the data; the other kinds pass on their presence expectations. An invalid spec or a transport error always fails. */
function rescored(evalCase: EvalCase, record: RunRecord): RunRecord {
  const spec = record.spec ? normalizeSpec(record.spec) : null;
  const correctness = evalCase.verify ? evalCase.verify(spec, record.text, EVAL_DATA) : [];
  const failures = failuresOf(evalCase, { ...record, correctness });
  return { ...record, correctness, failures, pass: failures.length === 0 };
}

function rescoreAll(results: ResultsFile): number {
  let changed = 0;
  for (const modeResults of Object.values(results.modes)) {
    for (const evalCase of EVAL_CASES) {
      const records = modeResults.cases[evalCase.id];
      if (!records) continue;
      modeResults.cases[evalCase.id] = records.map((record) => {
        const next = rescored(evalCase, record);
        if (next.pass !== record.pass) changed += 1;
        return next;
      });
    }
  }
  return changed;
}

function failuresOf(evalCase: EvalCase, record: Omit<RunRecord, "pass" | "failures">): string[] {
  const failures: string[] = [];
  if (record.hasSpec && !record.specValid) failures.push(`invalid spec: ${record.specIssues[0] ?? "?"}`);
  if (evalCase.verify) failures.push(...record.correctness);
  else failures.push(...presenceFailures(evalCase.expect, record));
  if (record.errors.length > 0) failures.push(...record.errors);
  return failures;
}

let judgeModel: LanguageModel | null | undefined;

async function serverDefaultModelId(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/chat`);
  const body = (await response.json()) as { default?: string };
  return body.default ?? "";
}

async function resolveJudgeModel(): Promise<LanguageModel | null> {
  if (judgeModel !== undefined) return judgeModel;
  const id = MODEL === "server default" ? await serverDefaultModelId() : MODEL;
  const entry = demoModels()[id];
  const model = entry && typeof entry === "object" && "model" in entry ? entry.model : entry;
  judgeModel = model ? (typeof model === "function" ? model() : model) : null;
  if (!judgeModel) console.log(`      no judge: model "${id}" is not in this registry`);
  return judgeModel;
}

async function runCase(evalCase: EvalCase, mode: Mode, run: number, noJudge: boolean): Promise<RunRecord> {
  const domPage = await createDomPageHost(evalCase.page, { passive: false });
  const adminOn = mode === "on";
  const tools = { ...evalShopTools(domPage), ...(adminOn ? domPage.tools : {}) };
  const hostTools = [...shopHostToolDescriptors(), ...(adminOn ? adminHostToolDescriptors() : [])];
  const host = createHeadlessHost({ tools, hostTools, context: { path: evalCase.page } });
  const session: ChatSession = {
    chatId: crypto.randomUUID(),
    messages: [],
    host,
    seenToolCallIds: new Set(),
    request: { context: { path: evalCase.page }, hostTools },
  };
  const started = Date.now();
  const turn = await sendUserMessage(session, evalCase.prompt);
  const latencyMs = Date.now() - started;
  await domPage.dispose();
  const spec = specOf(lastAssistantMessage(session));
  const evaluation = evaluateSpec(spec);
  const judge = noJudge || turn.errors.length > 0 ? null : await judgeOf(evalCase, turn.text, spec);
  const base = {
    run,
    correctness: evalCase.verify ? evalCase.verify(spec, turn.text, EVAL_DATA) : [],
    judge,
    hasSpec: spec !== null,
    specValid: spec !== null && evaluation.ok,
    specIssues: evaluation.issues.map((issue) => `${issue.path} ${issue.message}`),
    components: componentsOf(spec),
    elementCount: spec ? Object.keys(spec.elements).length : 0,
    tools: turn.tools,
    text: turn.text,
    latencyMs,
    spec,
    errors: turn.errors,
  };
  const failures = failuresOf(evalCase, base);
  return { ...base, pass: failures.length === 0, failures };
}

async function judgeOf(evalCase: EvalCase, text: string, spec: Spec | null): Promise<JudgeScore | null> {
  const model = await resolveJudgeModel();
  if (!model) return null;
  return judgeReply(model, { prompt: evalCase.prompt, text, specTree: specTree(spec) }, demoProviderOptions);
}

async function runCaseWithinQuota(evalCase: EvalCase, mode: Mode, run: number, paceMs: number, noJudge: boolean): Promise<RunRecord> {
  for (let attempt = 1; ; attempt += 1) {
    const record = await runCase(evalCase, mode, run, noJudge);
    if (!hitQuota(record) || attempt >= QUOTA_RETRY_LIMIT) {
      if (paceMs > 0) await pause(paceMs);
      return record;
    }
    console.log(`      ${evalCase.id} run ${run}: provider quota hit, waiting ${QUOTA_COOLDOWN_MS / 1000}s before attempt ${attempt + 1}`);
    await pause(QUOTA_COOLDOWN_MS);
  }
}

async function loadResults(path = RESULTS_PATH): Promise<ResultsFile> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as ResultsFile;
  } catch {
    return { modes: {} };
  }
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function isDetour(record: RunRecord) {
  return record.tools.some((tool) => tool.startsWith("admin_"));
}

function judgeSummary(records: RunRecord[]): string {
  const totals = records.flatMap((record) => (record.judge ? [judgeTotal(record.judge)] : []));
  if (totals.length === 0) return "judge —";
  const mean = totals.reduce((sum, value) => sum + value, 0) / totals.length;
  return `judge ${mean.toFixed(1)}/${JUDGE_SCORE_MAX} (${Math.min(...totals)}–${Math.max(...totals)})`;
}

function caseCell(records: RunRecord[] | undefined, showDetours: boolean): string {
  if (!records || records.length === 0) return "—";
  const passed = records.filter((record) => record.pass).length;
  const withSpec = records.filter((record) => record.hasSpec).length;
  const detours = records.filter(isDetour).length;
  const parts = [`${passed}/${records.length}`, judgeSummary(records), `spec ${withSpec}/${records.length}`];
  if (showDetours) parts.push(`detours ${detours}`);
  parts.push(`${(median(records.map((record) => record.latencyMs)) / 1000).toFixed(1)} s`);
  return parts.join(" · ");
}

function caseTable(results: ResultsFile): string {
  const lines = ["| case | kind | admin on | admin off |", "|---|---|---|---|"];
  for (const evalCase of EVAL_CASES) {
    const on = results.modes.on?.cases[evalCase.id];
    const off = results.modes.off?.cases[evalCase.id];
    const showDetours = evalCase.kind === "ui";
    lines.push(`| ${evalCase.id} | ${evalCase.kind} | ${caseCell(on, showDetours)} | ${caseCell(off, showDetours)} |`);
  }
  return lines.join("\n");
}

type UiSummary = { runs: number; passes: number; specs: number; detours: number; judge: string; latency: number };

function uiSummary(mode: ModeResults | undefined): UiSummary | null {
  if (!mode) return null;
  const records = UI_CASES.flatMap((id) => mode.cases[id] ?? []);
  if (records.length === 0) return null;
  return {
    runs: records.length,
    passes: records.filter((record) => record.pass).length,
    specs: records.filter((record) => record.hasSpec).length,
    detours: records.filter(isDetour).length,
    judge: judgeSummary(records).replace("judge ", ""),
    latency: median(records.map((record) => record.latencyMs)),
  };
}

function summaryRow(label: string, mode: Mode, results: ModeResults | undefined): string | null {
  const summary = uiSummary(results);
  if (!summary) return null;
  return `| ${label} | ${mode} | ${results?.model ?? ""} | ${summary.passes}/${summary.runs} | ${summary.specs}/${summary.runs} | ${summary.detours} | ${summary.judge} | ${(summary.latency / 1000).toFixed(1)} s |`;
}

async function labelledResults(): Promise<Array<{ label: string; results: ResultsFile }>> {
  const dir = fileURLToPath(RESULTS_DIR);
  const files = (await readdir(dir)).filter((name) => /^\.eval-ui(\.[^.]+)?\.json$/.test(name)).sort();
  const entries: Array<{ label: string; results: ResultsFile }> = [];
  for (const name of files) {
    const label = name.replace(/\.json$/, "").replace(/^\.eval-ui\.?/, "") || "default";
    entries.push({ label, results: await loadResults(`${dir}${name}`) });
  }
  return entries;
}

async function summaryAcrossModels(): Promise<string> {
  const lines = ["| label | admin | model | correct | specs | detours | judge mean (min–max) | latency (median) |", "|---|---|---|---|---|---|---|---|"];
  for (const { label, results } of await labelledResults()) {
    for (const mode of ["on", "off"] as const) {
      const row = summaryRow(label, mode, results.modes[mode]);
      if (row) lines.push(row);
    }
  }
  return lines.join("\n");
}

function caseSection(evalCase: EvalCase, results: ResultsFile): string {
  const lines = [`### ${evalCase.id} — ${evalCase.kind} · \`${evalCase.page}\``, "", `> ${evalCase.prompt}`, ""];
  for (const mode of ["on", "off"] as const) {
    const records = results.modes[mode]?.cases[evalCase.id] ?? [];
    const record = records[0];
    if (!record) continue;
    const verdict = record.pass ? "pass" : `fail (${record.failures.join("; ")})`;
    const judge = record.judge ? `judge ${judgeTotal(record.judge)}/${JUDGE_SCORE_MAX} (answers ${record.judge.answers}, fit ${record.judge.fit}, concise ${record.judge.concise})` : "no judge";
    lines.push(`**admin ${mode}** (run 1 of ${records.length}) — ${verdict} · ${judge} · tools: ${record.tools.join(", ") || "none"} · ${record.latencyMs} ms`, "");
    const others = records.slice(1).filter((candidate) => !candidate.pass);
    if (others.length > 0) lines.push(`Other failing runs: ${others.map((candidate) => `run ${candidate.run}: ${candidate.failures.join("; ")}`).join(" · ")}`, "");
    lines.push(`Text: ${record.text.length > TEXT_PREVIEW * 3 ? `${record.text.slice(0, TEXT_PREVIEW * 3)}…` : record.text || "(none)"}`, "");
    lines.push("```", specTree(record.spec), "```", "");
    if (record.specIssues.length > 0) lines.push(`Validation: ${record.specIssues.join("; ")}`, "");
  }
  return lines.join("\n");
}

const VERDICT_MARKER = "## Verdict";

async function existingVerdict(path: string): Promise<string> {
  try {
    const current = await readFile(path, "utf8");
    const index = current.indexOf(VERDICT_MARKER);
    return index === -1 ? "" : current.slice(index);
  } catch {
    return "";
  }
}

async function reportMarkdown(results: ResultsFile, reportPath: string): Promise<string> {
  const ranAt = results.modes.on?.ranAt ?? results.modes.off?.ranAt ?? "";
  const model = results.modes.on?.model ?? results.modes.off?.model ?? MODEL;
  const runs = Math.max(...Object.values(results.modes).flatMap((mode) => Object.values(mode.cases).map((records) => records.length)), 0);
  return [
    `# Generative UI with admin on and off${LABEL ? ` — ${LABEL}` : ""}`,
    "",
    `Ten real-user prompts on the shop admin, each run ${runs} times per mode with \`${model}\` (${ranAt.slice(0, 10)}). "on" = \`admin: true\` on the server and the \`admin_*\` host tools sent by the client, as shop-admin ships; "off" = \`VEXA_ADMIN=off\` and no admin descriptors. The shop's own host tools are registered in both modes.`,
    "",
    "A \`ui\` case passes only when the rendered data matches \`lib/shop/data.ts\` (\`verify\` in \`lib/eval-ui/cases.ts\`: the right order ids in the table, the right counts in the chart, a real aggregate in a metric); the other kinds pass on presence checks. Every run is also scored by the same model on a fixed rubric (answers / fit / concise, 0–2 each), reported as mean (min–max). Detours = admin tools called in a \`ui\` case.",
    "",
    "```bash",
    "bun run dev                       # admin on (default)",
    "bun run eval:ui -- --mode=on",
    "VEXA_ADMIN=off bun run dev        # restart the server with admin off",
    "bun run eval:ui -- --mode=off --report",
    "bun run eval:ui -- --runs=0 --report   # rebuild this file (and the /tests/eval-ui fixture) without calling the model",
    "bun run eval:ui -- --runs=0 --rescore --report   # re-verify stored replies after a change to lib/eval-ui/cases.ts",
    "VEXA_EVAL_LABEL=gemini VEXA_SCENARIO_MODEL=gemini-3.1-flash-lite bun run eval:ui -- --mode=on --pace=20000   # another model, its own files",
    "```",
    "",
    "## Summary across models",
    "",
    "UI cases only (7 cases × runs). Each label is one `.eval-ui.<label>.json`.",
    "",
    await summaryAcrossModels(),
    "",
    "## Results",
    "",
    caseTable(results),
    "",
    "Cells: correct/runs · judge mean (min–max) · runs with a spec · admin detours (ui cases) · median latency.",
    "",
    "## Cases",
    "",
    ...EVAL_CASES.map((evalCase) => caseSection(evalCase, results)),
    await existingVerdict(reportPath),
  ].join("\n");
}

function fixtureSource(results: ResultsFile): string {
  const entries = EVAL_CASES.map((evalCase) => {
    const record = results.modes.on?.cases[evalCase.id]?.find((candidate) => candidate.spec) ?? null;
    return { id: evalCase.id, prompt: evalCase.prompt, kind: evalCase.kind, spec: record?.spec ?? null, text: record?.text ?? "" };
  });
  return [
    'import type { Spec } from "vexa/protocol";',
    "",
    "export type EvalUiSpec = { id: string; prompt: string; kind: string; spec: Spec | null; text: string };",
    "",
    `/** Generated by scripts/eval-ui.ts from the last reported admin-on run (${results.modes.on?.model ?? ""}); rendered on /tests/eval-ui. */`,
    `export const EVAL_UI_SPECS: EvalUiSpec[] = ${JSON.stringify(entries, null, 2)};`,
    "",
  ].join("\n");
}

function printRun(evalCase: EvalCase, record: RunRecord) {
  const judge = record.judge ? `judge ${judgeTotal(record.judge)}` : "judge —";
  console.log(
    `${record.pass ? "PASS" : "FAIL"}  ${evalCase.id.padEnd(18)} run ${record.run}  ${judge}  ${record.components.join(",") || "no UI"}  [${record.tools.join(",")}]  ${record.latencyMs} ms${record.pass ? "" : `  ← ${record.failures.join("; ")}`}`,
  );
}

async function main() {
  const { mode, runs, report, noJudge, paceMs, rescore, ids } = parseArgs(process.argv.slice(2));
  const selected = ids.length > 0 ? EVAL_CASES.filter((evalCase) => ids.includes(evalCase.id)) : EVAL_CASES;
  const results = await loadResults();
  if (rescore) {
    const changed = rescoreAll(results);
    await writeFile(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
    console.log(`rescored ${RESULTS_PATH}: ${changed} verdict(s) changed`);
  }
  const modeResults: ModeResults = results.modes[mode] ?? { ranAt: "", model: MODEL, cases: {} };
  if (runs > 0) {
    modeResults.ranAt = new Date().toISOString();
    modeResults.model = MODEL === "server default" ? await serverDefaultModelId() : MODEL;
    console.log(`eval-ui: ${selected.length} case(s) × ${runs} run(s), admin ${mode}, ${BASE_URL}, ${modeResults.model}${LABEL ? `, label ${LABEL}` : ""}`);
  }
  for (const evalCase of runs > 0 ? selected : []) {
    const records: RunRecord[] = [];
    for (let run = 1; run <= runs; run += 1) {
      const record = await runCaseWithinQuota(evalCase, mode, run, paceMs, noJudge);
      records.push(record);
      printRun(evalCase, record);
    }
    if (records.every((record) => record.errors.length > 0) && modeResults.cases[evalCase.id]) {
      console.log(`      kept the earlier ${evalCase.id} records: every new run failed before the model answered`);
      continue;
    }
    modeResults.cases[evalCase.id] = records;
  }
  results.modes[mode] = modeResults;
  if (runs > 0) await writeFile(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
  console.log("");
  console.log(caseTable(results));
  if (report) {
    if (results.modes.on) await writeFile(FIXTURE_PATH, fixtureSource(results));
    await writeFile(REPORT_PATH, await reportMarkdown(results, REPORT_PATH));
    console.log(`\nreport → ${REPORT_PATH}`);
    if (LABEL) {
      const summary = await loadResults();
      await writeFile(SUMMARY_REPORT_PATH, await reportMarkdown(summary, SUMMARY_REPORT_PATH));
    }
  }
}

await main();
