import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getToolName, type UIMessage } from "ai";
import {
  SCENARIOS,
  describeStep,
  isApproveStep,
  isExpectSentToChatStep,
  isExpectSpecStep,
  isPageClickStep,
  isPageNavigateStep,
  isPatchStep,
  isPressStep,
  isRejectStep,
  isRequestStep,
  isTypeStep,
  isUserStep,
  type ModelExpectations,
  type PageExpectation,
  type Scenario,
  type StoreExpectation,
  type ScenarioResult,
  type ScenarioResultsFile,
  type Step,
  type StepResult,
} from "@/lib/scenarios";
import { createHeadlessHost, createSpecDriver, type SpecDriver } from "@/lib/scenarios/driver";
import { createDomPageHost, type DomPageHost } from "@/lib/scenarios/dom-host";
import type { AdminPages } from "vexa/admin";
import { ADMIN_TOOLS, confirmationDialogsIn } from "vexa/admin";
import { HOST_TOOL_DEFINITIONS } from "@/lib/shop/host-tools";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";
import {
  BASE_URL,
  MODEL,
  hasPendingApproval,
  lastAssistantMessage,
  runModelTurnRaw,
  textOf,
  toolParts,
  upsertMessage,
  withPart,
  type ChatSession,
  type ToolPart,
  type Turn,
} from "@/lib/scenarios/model-turn";

const HOST_TOOLS_OFF = process.env.VEXA_SCENARIO_HOST_TOOLS === "off";
const SHOP_HOST_TOOL_NAMES = new Set<string>(Object.keys(HOST_TOOL_DEFINITIONS));
const TEXT_PREVIEW_LENGTH = 80;
const RESULTS_PATH = fileURLToPath(new URL("../.scenario-results.json", import.meta.url));
const FIXTURE_ONLY_NOTE = "fixture only, no script";

type Session = ChatSession & {
  scenario: Scenario;
  domPage: DomPageHost | null;
  driver: SpecDriver | null;
  lastTurn: Turn | null;
};

async function tryHostConfirm(session: Session, toolName: string, approved: boolean): Promise<string | "handled" | "not-pending"> {
  const confirmed = await session.host.confirmTool(toolName, approved);
  if (!confirmed) return "not-pending";
  const message = lastAssistantMessage(session);
  const part = message && toolParts(message).find((candidate) => candidate.toolCallId === confirmed.toolCallId);
  if (!message || !part) return `Lost the pending tool call for "${toolName}" while confirming`;
  const settled = withPart(message, confirmed.toolCallId, { ...part, state: "output-available", output: confirmed.output } as ToolPart);
  upsertMessage(session, settled);
  session.driver?.recordToolOutputs([settled]);
  return "handled";
}


/** Applies any data-spec parts from the final assistant message onto the fixture's live spec, the way a real client would merge a streamed patch or flat replacement. */
async function runModelTurn(session: Session, continueLast: boolean): Promise<Turn> {
  const turn = await runModelTurnRaw(session, continueLast, (settled) => session.driver?.recordToolOutputs([settled]));
  session.driver?.applySpecParts(lastAssistantMessage(session)?.parts ?? []);
  session.lastTurn = turn;
  return turn;
}

function answerApproval(session: Session, toolName: string, approved: boolean): string | null {
  const message = lastAssistantMessage(session);
  const part = toolParts(message).find((candidate) => candidate.state === "approval-requested" && getToolName(candidate) === toolName);
  if (!message || !part || part.state !== "approval-requested") return `No pending approval for "${toolName}"`;
  const responded = { ...part, state: "approval-responded", approval: { id: part.approval.id, approved } } as ToolPart;
  upsertMessage(session, withPart(message, part.toolCallId, responded));
  return null;
}

function uniqueSorted(names: string[]) {
  return [...new Set(names)].sort();
}

function matchesExpectedInput(actual: unknown, expected: Record<string, unknown>): boolean {
  if (typeof actual !== "object" || actual === null) return false;
  const record = actual as Record<string, unknown>;
  return Object.entries(expected).every(([key, value]) => JSON.stringify(record[key]) === JSON.stringify(value));
}

function checkModelExpectations(step: ModelExpectations, turn: Turn): string[] {
  const errors: string[] = [];
  if (step.expectNoTools && turn.tools.length > 0) errors.push(`Expected no tools, saw ${turn.tools.join(", ")}`);
  if (step.expectTools && step.expectToolsInOrder && step.expectTools.join(",") !== turn.tools.join(",")) {
    errors.push(`Expected tools in order [${step.expectTools.join(", ")}], saw [${turn.tools.join(", ")}]`);
  }
  if (step.expectTools && !step.expectToolsInOrder && uniqueSorted(step.expectTools).join(",") !== uniqueSorted(turn.tools).join(",")) {
    errors.push(`Expected tools {${step.expectTools.join(", ")}}, saw {${turn.tools.join(", ")}}`);
  }
  for (const name of step.expectToolsInclude ?? []) {
    if (!turn.tools.includes(name)) errors.push(`Expected ${name} to be called, saw {${turn.tools.join(", ")}}`);
  }
  if (step.expectToolsAnyOf && !step.expectToolsAnyOf.some((set) => uniqueSorted(set).join(",") === uniqueSorted(turn.tools).join(","))) {
    errors.push(`Expected tools to be one of ${step.expectToolsAnyOf.map((set) => `{${set.join(", ")}}`).join(" / ")}, saw {${turn.tools.join(", ")}}`);
  }
  if (typeof step.expectText === "string" && !turn.text.includes(step.expectText)) errors.push(`Expected text to include "${step.expectText}"`);
  if (step.expectText instanceof RegExp && !step.expectText.test(turn.text)) errors.push(`Expected text to match ${step.expectText}`);
  if (step.expectDataParts) {
    for (const type of step.expectDataParts) {
      if (!turn.dataParts.includes(type)) errors.push(`Expected a "${type}" data part, saw [${turn.dataParts.join(", ")}]`);
    }
  }
  if (step.expectToolInput) {
    for (const [name, expected] of Object.entries(step.expectToolInput)) {
      const actual = turn.toolInputs[name];
      if (!matchesExpectedInput(actual, expected)) {
        errors.push(`Expected ${name} input to include ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    }
  }
  return errors;
}

function requireDriver(session: Session): SpecDriver {
  if (!session.driver) throw new Error(`Scenario "${session.scenario.id}" needs a fixture for press/type/expectState steps`);
  return session.driver;
}

function emptyResult(index: number, step: Step): StepResult {
  return { index, label: describeStep(step), pass: true, tools: [], text: "", stateDiff: {}, errors: [] };
}

function applyStateExpectation(driver: SpecDriver, expected: Record<string, unknown> | undefined, result: StepResult) {
  if (!expected) return;
  result.stateDiff = driver.diffState(expected);
  for (const [statePath, diff] of Object.entries(result.stateDiff)) {
    result.errors.push(`${statePath}: expected ${JSON.stringify(diff.expected)}, got ${JSON.stringify(diff.actual)}`);
  }
}

function applyTurn(result: StepResult, turn: Turn, step: ModelExpectations) {
  result.tools.push(...turn.tools);
  result.text = turn.text;
  result.errors.push(...turn.errors, ...checkModelExpectations(step, turn));
}

async function sendUserMessage(session: Session, text: string): Promise<Turn> {
  session.messages.push({ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text }] });
  return runModelTurn(session, false);
}

async function runPressStep(session: Session, step: Extract<Step, { press: string }>, result: StepResult) {
  const driver = requireDriver(session);
  await driver.press(step.press, step.item);
  if (!step.deferSend) {
    if (step.expectNoModelTurn) {
      if (session.host.sentToChat.length > 0) {
        result.errors.push(`Expected no model turn, but the press forwarded: ${session.host.sentToChat.join(" | ")}`);
      }
    } else {
      for (const text of driver.drainSentToChat()) applyTurn(result, await sendUserMessage(session, text), {});
    }
  }
  applyStateExpectation(driver, step.expectState, result);
  if (step.expectToast !== undefined && driver.get("/toast") !== step.expectToast) {
    result.errors.push(`Expected toast "${step.expectToast}", got ${JSON.stringify(driver.get("/toast"))}`);
  }
}

function runExpectSentToChatStep(session: Session, step: Extract<Step, { expectSentToChat: string | RegExp }>, result: StepResult) {
  const driver = requireDriver(session);
  const forwarded = driver.drainSentToChat();
  const matches = forwarded.some((text) =>
    step.expectSentToChat instanceof RegExp ? step.expectSentToChat.test(text) : text.includes(step.expectSentToChat),
  );
  if (!matches) {
    result.errors.push(`Expected a message sent to chat matching ${String(step.expectSentToChat)}, saw [${forwarded.join(" | ")}]`);
  }
}

function runPatchStep(session: Session, step: Extract<Step, { patch: unknown }>) {
  requireDriver(session).patch(step.patch);
}

function runExpectSpecStep(session: Session, step: Extract<Step, { expectSpec: Record<string, { exists?: boolean }> }>, result: StepResult) {
  const driver = requireDriver(session);
  for (const [id, expectation] of Object.entries(step.expectSpec)) {
    if (expectation.exists === undefined) continue;
    const actual = driver.hasElement(id);
    if (actual !== expectation.exists) result.errors.push(`expectSpec ${id}: expected exists=${expectation.exists}, got ${actual}`);
  }
}

async function runRequestStep(step: Extract<Step, { request: unknown }>, result: StepResult) {
  const { request } = step;
  const response = await fetch(`${BASE_URL}${request.path}`, {
    method: request.method,
    headers: { "content-type": "application/json", ...(request.headers ?? {}) },
    body: request.body !== undefined ? JSON.stringify(request.body) : undefined,
  });
  const body = await response.text();
  result.text = preview(body);
  if (response.status !== step.expectStatus) result.errors.push(`Expected status ${step.expectStatus}, got ${response.status}: ${body.slice(0, 200)}`);
  if (step.expectBody && !step.expectBody.test(body)) result.errors.push(`Expected body to match ${step.expectBody}, got: ${body.slice(0, 200)}`);
}

function applyDecidedAdminRun(session: Session, step: ModelExpectations, result: StepResult): boolean {
  if (!session.domPage || !session.lastTurn) return false;
  applyTurn(result, session.lastTurn, step);
  return true;
}

function checkPageExpectation(session: Session, expected: PageExpectation | undefined, result: StepResult) {
  if (!expected) return;
  if (!session.domPage) {
    result.errors.push("expectPage needs a domPage scenario");
    return;
  }
  const doc = session.domPage.container.ownerDocument;
  const dialogOpen = confirmationDialogsIn(doc.body).length > 0;
  const text = doc.body.textContent ?? "";
  const path = session.domPage.page().path;
  if (expected.path !== undefined && path !== expected.path) result.errors.push(`Expected the page to be ${expected.path}, it is ${path}`);
  if (expected.dialogOpen !== undefined && dialogOpen !== expected.dialogOpen) {
    result.errors.push(expected.dialogOpen ? "Expected the app's confirmation dialog to be open" : "Expected no confirmation dialog on the page");
  }
  if (expected.textPresent && !text.includes(expected.textPresent)) result.errors.push(`Expected the page to show "${expected.textPresent}"`);
  if (expected.textAbsent && text.includes(expected.textAbsent)) result.errors.push(`Expected the page not to show "${expected.textAbsent}"`);
}

function checkStoreExpectation(session: Session, expected: StoreExpectation | undefined, result: StepResult) {
  if (!expected) return;
  if (!session.domPage) {
    result.errors.push("expectStore needs a domPage scenario");
    return;
  }
  if (!expected.check(session.domPage.state())) result.errors.push(`Expected the store to satisfy: ${expected.label}`);
}

async function runPageClickStep(session: Session, step: Extract<Step, { pageClick: string }>, result: StepResult) {
  if (!session.domPage) {
    result.errors.push("pageClick needs a domPage scenario");
    return;
  }
  const pressed = await session.domPage.pressButton(step.pageClick);
  if (!pressed) result.errors.push(`No button named "${step.pageClick}" on the page`);
  checkPageExpectation(session, step.expectPage, result);
}

async function runPageNavigateStep(session: Session, step: Extract<Step, { pageNavigate: string }>, result: StepResult) {
  if (!session.domPage) {
    result.errors.push("pageNavigate needs a domPage scenario");
    return;
  }
  await session.domPage.navigate(step.pageNavigate);
  await session.domPage.settle();
  checkPageExpectation(session, step.expectPage, result);
}

async function runApprovalStep(session: Session, toolName: string, approved: boolean, step: ModelExpectations, result: StepResult) {
  if (toolName === ADMIN_TOOLS.run && applyDecidedAdminRun(session, step, result)) return;
  const hostOutcome = await tryHostConfirm(session, toolName, approved);
  if (hostOutcome !== "not-pending") {
    if (hostOutcome !== "handled") {
      result.errors.push(hostOutcome);
      return;
    }
  } else {
    const problem = answerApproval(session, toolName, approved);
    if (problem) {
      result.errors.push(problem);
      return;
    }
  }
  applyTurn(result, await runModelTurn(session, true), step);
}

async function runStep(session: Session, index: number, step: Step): Promise<StepResult> {
  const result = emptyResult(index, step);
  try {
    if (isUserStep(step)) applyTurn(result, await sendUserMessage(session, step.user), step);
    else if (isPressStep(step)) await runPressStep(session, step, result);
    else if (isTypeStep(step)) await requireDriver(session).type(step.type.path, step.type.value);
    else if (isApproveStep(step)) await runApprovalStep(session, step.approve, true, step, result);
    else if (isRejectStep(step)) await runApprovalStep(session, step.reject, false, step, result);
    else if (isPageClickStep(step)) await runPageClickStep(session, step, result);
    else if (isPageNavigateStep(step)) await runPageNavigateStep(session, step, result);
    else if (isExpectSentToChatStep(step)) runExpectSentToChatStep(session, step, result);
    else if (isRequestStep(step)) await runRequestStep(step, result);
    else if (isPatchStep(step)) runPatchStep(session, step);
    else if (isExpectSpecStep(step)) runExpectSpecStep(session, step, result);
    else applyStateExpectation(requireDriver(session), step.expectState, result);
    if (!isPageClickStep(step) && !isPageNavigateStep(step) && "expectPage" in step) checkPageExpectation(session, step.expectPage, result);
    if ("expectStore" in step) checkStoreExpectation(session, step.expectStore, result);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }
  result.pass = result.errors.length === 0;
  return result;
}

function seedPriorSpec(session: Session, spec: Scenario["priorAssistantSpec"]) {
  if (!spec) return;
  const specMessage: UIMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    parts: [{ type: "text", text: "Here it is." }, { type: "data-spec", data: { type: "flat", spec } }] as UIMessage["parts"],
  };
  session.messages.push({ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: "Show the current form." }] }, specMessage);
  session.driver?.applySpecParts(specMessage.parts);
}

function adminRunDecision(scenario: Scenario): boolean {
  return !scenario.script.some((step) => isRejectStep(step) && step.reject === ADMIN_TOOLS.run);
}

let seedPages: AdminPages | null = null;

/** What an earlier visit would have left in the browser's storage: one discovery over a throwaway copy of the app, exported once per run. */
async function storedPagesSeed(): Promise<AdminPages> {
  if (seedPages) return seedPages;
  const earlier = await createDomPageHost("/", { passive: false, frame: false });
  await earlier.discover({ skip: (path) => path.startsWith("/guides") });
  seedPages = earlier.exportPages();
  await earlier.dispose();
  return seedPages;
}

async function createDomPage(scenario: Scenario): Promise<DomPageHost | null> {
  if (!scenario.domPage) return null;
  console.log(`  dom page ${scenario.page}`);
  const approved = adminRunDecision(scenario);
  const pages = scenario.seeded ? await storedPagesSeed() : undefined;
  const host = await createDomPageHost(scenario.page, {
    setup: scenario.setup,
    confirm: async () => approved,
    confirmPolicy: scenario.confirmPolicy,
    pages,
  });
  if (pages) console.log(`  restored ${pages.pages.length} stored pages`);
  if (!scenario.discover) return host;
  const progress = await host.discover();
  console.log(`  discovered ${progress.visited.length} pages`);
  return host;
}

async function createSession(scenario: Scenario): Promise<Session> {
  const domPage = await createDomPage(scenario);
  const tools = { ...(scenario.tools ?? {}), ...(domPage?.tools ?? {}) };
  const host = createHeadlessHost({ tools, hostTools: scenario.hostTools, context: scenario.context });
  const session: Session = {
    scenario,
    chatId: crypto.randomUUID(),
    messages: [],
    host,
    request: { context: scenario.context ?? { path: scenario.page }, hostTools: scenario.hostTools ?? [] },
    domPage,
    driver: scenario.fixture ? createSpecDriver(scenario.fixture, host) : null,
    seenToolCallIds: new Set(),
    lastTurn: null,
  };
  seedPriorSpec(session, scenario.priorAssistantSpec);
  return session;
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const attempts = Math.max(1, scenario.attempts ?? 1);
  let result = await runScenarioOnce(scenario);
  for (let attempt = 2; attempt <= attempts && !result.pass; attempt += 1) {
    result = await runScenarioOnce(scenario);
    if (result.pass) result = { ...result, note: `passed on attempt ${attempt} of ${attempts}` };
  }
  return result;
}

async function runScenarioOnce(scenario: Scenario): Promise<ScenarioResult> {
  const ranAt = new Date().toISOString();
  if (scenario.script.length === 0) return { id: scenario.id, pass: true, ranAt, model: MODEL, note: FIXTURE_ONLY_NOTE, steps: [] };
  if (scenario.requiresEnv && !process.env[scenario.requiresEnv]) {
    return { id: scenario.id, pass: true, ranAt, model: MODEL, note: `skipped: start the dev server and the runner with ${scenario.requiresEnv}=1`, steps: [] };
  }
  const session = await createSession(scenario);
  const steps: StepResult[] = [];
  for (const [index, step] of scenario.script.entries()) steps.push(await runStep(session, index, step));
  await session.domPage?.dispose();
  return { id: scenario.id, pass: steps.every((step) => step.pass), ranAt, model: MODEL, steps };
}

function preview(text: string) {
  const oneLine = text.replace(/\s+/g, " ");
  return oneLine.length > TEXT_PREVIEW_LENGTH ? `${oneLine.slice(0, TEXT_PREVIEW_LENGTH)}…` : oneLine;
}

function printResult(result: ScenarioResult) {
  console.log(`\n${result.pass ? "PASS" : "FAIL"}  ${result.id}${result.note ? `  (${result.note})` : ""}`);
  if (result.steps.length === 0) return;
  const rows = result.steps.map((step) => [
    String(step.index + 1),
    step.pass ? "pass" : "FAIL",
    step.label,
    step.tools.join(", ") || "-",
    preview(step.text) || "-",
  ]);
  const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => row[column].length)));
  for (const row of rows) console.log("  " + row.map((cell, column) => cell.padEnd(widths[column])).join("  "));
  for (const step of result.steps) for (const error of step.errors) console.log(`    step ${step.index + 1}: ${error}`);
}

async function readResultsFile(): Promise<ScenarioResultsFile> {
  try {
    return JSON.parse(await readFile(RESULTS_PATH, "utf8")) as ScenarioResultsFile;
  } catch {
    return { ranAt: "", results: {} };
  }
}

async function writeResults(results: ScenarioResult[]) {
  const file = await readResultsFile();
  for (const result of results) file.results[result.id] = result;
  file.ranAt = new Date().toISOString();
  await mkdir(path.dirname(RESULTS_PATH), { recursive: true });
  await writeFile(RESULTS_PATH, JSON.stringify(file, null, 2));
}

function admittedToolName(name: string) {
  return SHOP_HOST_TOOL_NAMES.has(name) ? ADMIN_TOOLS.run : name;
}

function admittedToolSet(names: string[]): string[] {
  return [...new Set(names.map(admittedToolName))];
}

function withObserveAllowed(sets: string[][]): string[][] {
  const allowed = sets.flatMap((set) => [set, [...new Set([ADMIN_TOOLS.observe, ...set])]]);
  return [...new Map(allowed.map((set) => [uniqueSorted(set).join(","), set])).values()];
}

function admittedExpectations(step: ModelExpectations): ModelExpectations {
  const { expectTools, expectToolsAnyOf, expectToolsInclude, expectNoTools, expectText, expectDataParts, expectToolInput, expectPage, expectStore } = step;
  const next: ModelExpectations = { expectNoTools, expectText, expectDataParts, expectToolInput, expectPage, expectStore };
  if (expectToolsInclude) next.expectToolsInclude = admittedToolSet(expectToolsInclude);
  const sets: string[][] = [];
  if (expectTools) sets.push(admittedToolSet(expectTools));
  if (expectToolsAnyOf) sets.push(...expectToolsAnyOf.map(admittedToolSet));
  if (sets.length > 0) next.expectToolsAnyOf = withObserveAllowed(sets);
  return next;
}

function admittedStep(step: Step): Step {
  if (isUserStep(step)) return { user: step.user, ...admittedExpectations(step) };
  if (isApproveStep(step)) return { approve: admittedToolName(step.approve), ...admittedExpectations(step) };
  if (isRejectStep(step)) return { reject: admittedToolName(step.reject), ...admittedExpectations(step) };
  return step;
}

/** Runs a scenario with the shop host tools removed: only admin_observe / admin_run over the real page, and every host tool expectation rewritten to admin_run. */
function withoutHostTools(scenario: Scenario): Scenario {
  if (!scenario.page || scenario.page.startsWith("/guides")) return scenario;
  return {
    ...scenario,
    hostTools: adminHostToolDescriptors(),
    tools: undefined,
    domPage: true,
    script: scenario.script.map(admittedStep),
  };
}

const STEERING_FLAG = "--steering";

function selectScenarios(ids: string[]): Scenario[] {
  if (ids.length === 0) return SCENARIOS;
  const unknown = ids.filter((id) => !SCENARIOS.some((scenario) => scenario.id === id));
  if (unknown.length > 0) throw new Error(`Unknown scenario id(s): ${unknown.join(", ")}. Known: ${SCENARIOS.map((s) => s.id).join(", ")}`);
  return SCENARIOS.filter((scenario) => ids.includes(scenario.id));
}

async function main() {
  const args = process.argv.slice(2);
  const steeringOnly = args.includes(STEERING_FLAG);
  const chosen = selectScenarios(args.filter((arg) => arg !== STEERING_FLAG)).filter((scenario) => !steeringOnly || scenario.measures === "steering");
  const selected = HOST_TOOLS_OFF ? chosen.map(withoutHostTools) : chosen;
  const steering = selected.filter((scenario) => scenario.measures === "steering").length;
  console.log(`Running ${selected.length} scenario(s) against ${BASE_URL} with ${MODEL} (${steering} steering, ${selected.length - steering} runtime)`);
  if (HOST_TOOLS_OFF) console.log("host tools: off");
  const results: ScenarioResult[] = [];
  for (const scenario of selected) {
    const result = await runScenario(scenario);
    printResult(result);
    results.push(result);
  }
  await writeResults(results);
  const failed = results.filter((result) => !result.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed. Results written to ${RESULTS_PATH}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
