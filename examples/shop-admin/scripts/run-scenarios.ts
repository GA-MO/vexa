import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getToolName, isToolUIPart, readUIMessageStream, type UIMessage, type UIMessageChunk } from "ai";
import {
  SCENARIOS,
  describeStep,
  isApproveStep,
  isExpectSentToChatStep,
  isExpectSpecStep,
  isPatchStep,
  isPressStep,
  isRejectStep,
  isRequestStep,
  isTypeStep,
  isUserStep,
  type ModelExpectations,
  type Scenario,
  type ScenarioResult,
  type ScenarioResultsFile,
  type Step,
  type StepResult,
} from "@/lib/scenarios";
import { createHeadlessHost, createSpecDriver, type HeadlessHost, type SpecDriver } from "@/lib/scenarios/driver";

const BASE_URL = process.env.VEXA_DEMO_URL ?? "http://localhost:3001";
const MODEL = process.env.VEXA_SCENARIO_MODEL ?? "google/gemini-3.1-flash-lite";
const MAX_ROUND_TRIPS = 6;
const TEXT_PREVIEW_LENGTH = 80;
const RESULTS_PATH = fileURLToPath(new URL("../.scenario-results.json", import.meta.url));
const FIXTURE_ONLY_NOTE = "fixture only, no script";

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

type Session = {
  scenario: Scenario;
  chatId: string;
  messages: UIMessage[];
  host: HeadlessHost;
  driver: SpecDriver | null;
  seenToolCallIds: Set<string>;
};

type Turn = { tools: string[]; text: string; dataParts: string[]; toolInputs: Record<string, unknown>; errors: string[] };

function dataPartTypesOf(message: UIMessage | undefined): string[] {
  const types = (message?.parts ?? [])
    .map((part) => part.type)
    .filter((type) => type.startsWith("data-"));
  return [...new Set(types)];
}

function parseSseEvent(event: string): UIMessageChunk[] {
  const data = event
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("\n");
  if (!data || data === "[DONE]") return [];
  return [JSON.parse(data) as UIMessageChunk];
}

function sseChunkStream(body: ReadableStream<Uint8Array>): ReadableStream<UIMessageChunk> {
  const decoder = new TextDecoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, UIMessageChunk>({
      transform(bytes, controller) {
        buffer += decoder.decode(bytes, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) for (const chunk of parseSseEvent(event)) controller.enqueue(chunk);
      },
      flush(controller) {
        for (const chunk of parseSseEvent(buffer)) controller.enqueue(chunk);
      },
    }),
  );
}

function lastAssistantMessage(session: Session): UIMessage | undefined {
  const last = session.messages.at(-1);
  return last?.role === "assistant" ? last : undefined;
}

function textOf(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function toolParts(message: UIMessage | undefined): ToolPart[] {
  return (message?.parts ?? []).filter((part): part is ToolPart => isToolUIPart(part));
}

function upsertMessage(session: Session, message: UIMessage) {
  const index = session.messages.findIndex((existing) => existing.id === message.id);
  if (index === -1) session.messages.push(message);
  else session.messages[index] = message;
}

function recordNewToolCalls(session: Session, message: UIMessage, turn: Turn) {
  for (const part of toolParts(message)) {
    if (session.seenToolCallIds.has(part.toolCallId)) continue;
    session.seenToolCallIds.add(part.toolCallId);
    const name = getToolName(part);
    turn.tools.push(name);
    turn.toolInputs[name] = (part as { input?: unknown }).input;
  }
}

async function postChat(session: Session, continuation: UIMessage | undefined): Promise<Response> {
  const { scenario } = session;
  return fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: session.chatId,
      trigger: "submit-message",
      messageId: continuation?.id,
      messages: session.messages,
      model: MODEL,
      context: scenario.context ?? { path: scenario.page },
      hostTools: scenario.hostTools ?? [],
    }),
  });
}

async function readAssistantMessage(response: Response, continuation: UIMessage | undefined, errors: string[]): Promise<UIMessage | undefined> {
  if (!response.body) {
    errors.push("Response had no body");
    return undefined;
  }
  let message: UIMessage | undefined;
  const stream = readUIMessageStream<UIMessage>({
    message: continuation,
    stream: sseChunkStream(response.body),
    onError: (error) => errors.push(error instanceof Error ? error.message : String(error)),
  });
  for await (const state of stream) message = state;
  return message;
}

function withPart(message: UIMessage, toolCallId: string, next: ToolPart): UIMessage {
  return {
    ...message,
    parts: message.parts.map((part) => (isToolUIPart(part) && part.toolCallId === toolCallId ? next : part)),
  };
}

async function runPendingHostTools(session: Session, message: UIMessage): Promise<{ message: UIMessage; ran: boolean }> {
  let next = message;
  let ran = false;
  for (const part of toolParts(message)) {
    const name = getToolName(part);
    if (part.state !== "input-available" || !session.host.hasTool(name)) continue;
    if (session.host.needsConfirm(name)) {
      session.host.requestConfirm({ toolCallId: part.toolCallId, name, input: part.input });
      continue;
    }
    const output = await session.host.runTool(name, part.input, { toolCallId: part.toolCallId, source: "model" });
    next = withPart(next, part.toolCallId, { ...part, state: "output-available", output } as ToolPart);
    ran = true;
  }
  return { message: next, ran };
}

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

function hasPendingApproval(message: UIMessage) {
  return toolParts(message).some((part) => part.state === "approval-requested");
}

async function runModelTurnRaw(session: Session, continueLast: boolean): Promise<Turn> {
  const turn: Turn = { tools: [], text: "", dataParts: [], toolInputs: {}, errors: [] };
  let continuation = continueLast ? lastAssistantMessage(session) : undefined;
  for (let roundTrip = 0; roundTrip < MAX_ROUND_TRIPS; roundTrip += 1) {
    const response = await postChat(session, continuation);
    if (!response.ok) {
      turn.errors.push(`POST /api/chat → ${response.status}: ${(await response.text()).slice(0, 200)}`);
      return turn;
    }
    const message = await readAssistantMessage(response, continuation, turn.errors);
    if (!message) return turn;
    recordNewToolCalls(session, message, turn);
    const { message: settled, ran } = await runPendingHostTools(session, message);
    upsertMessage(session, settled);
    session.driver?.recordToolOutputs([settled]);
    turn.text = textOf(settled);
    turn.dataParts = dataPartTypesOf(settled);
    if (turn.errors.length > 0 || hasPendingApproval(settled) || !ran) return turn;
    continuation = settled;
  }
  turn.errors.push(`Stopped after ${MAX_ROUND_TRIPS} round trips`);
  return turn;
}

/** Applies any data-spec parts from the final assistant message onto the fixture's live spec, the way a real client would merge a streamed patch or flat replacement. */
async function runModelTurn(session: Session, continueLast: boolean): Promise<Turn> {
  const turn = await runModelTurnRaw(session, continueLast);
  session.driver?.applySpecParts(lastAssistantMessage(session)?.parts ?? []);
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

async function runApprovalStep(session: Session, toolName: string, approved: boolean, step: ModelExpectations, result: StepResult) {
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
    else if (isExpectSentToChatStep(step)) runExpectSentToChatStep(session, step, result);
    else if (isRequestStep(step)) await runRequestStep(step, result);
    else if (isPatchStep(step)) runPatchStep(session, step);
    else if (isExpectSpecStep(step)) runExpectSpecStep(session, step, result);
    else applyStateExpectation(requireDriver(session), step.expectState, result);
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

function createSession(scenario: Scenario): Session {
  const host = createHeadlessHost({ tools: scenario.tools, hostTools: scenario.hostTools, context: scenario.context });
  const session: Session = {
    scenario,
    chatId: crypto.randomUUID(),
    messages: [],
    host,
    driver: scenario.fixture ? createSpecDriver(scenario.fixture, host) : null,
    seenToolCallIds: new Set(),
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
  const session = createSession(scenario);
  const steps: StepResult[] = [];
  for (const [index, step] of scenario.script.entries()) steps.push(await runStep(session, index, step));
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

function selectScenarios(ids: string[]): Scenario[] {
  if (ids.length === 0) return SCENARIOS;
  const unknown = ids.filter((id) => !SCENARIOS.some((scenario) => scenario.id === id));
  if (unknown.length > 0) throw new Error(`Unknown scenario id(s): ${unknown.join(", ")}. Known: ${SCENARIOS.map((s) => s.id).join(", ")}`);
  return SCENARIOS.filter((scenario) => ids.includes(scenario.id));
}

async function main() {
  const selected = selectScenarios(process.argv.slice(2));
  console.log(`Running ${selected.length} scenario(s) against ${BASE_URL} with ${MODEL}`);
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
