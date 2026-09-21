import { check, click, fill, readTable, select, submit, type ActionResult } from "./actions";
import { failure, type AdminErrorCode } from "./errors";
import type { Candidate, Resolver } from "./resolve";
import { describePlanIssue, planSchema, type Step, type Target } from "./schema";
import type { ObservationCache } from "./cache";
import { confirmationDialogsIn, insideConfirmationDialog, newConfirmationDialog } from "./dialogs";
import { collapse, collectLinks, isSensitive, snapshot, type PageInfo, type Snapshot } from "./snapshot";
import { isRoute, routePath } from "./paths";
import { waitForIdle, waitForNavigation, type WaitOptions } from "./wait";

export type NavigateMode = "router" | "reload";

export type NavigateOutcome = { ok: true; mode: NavigateMode } | { ok: false };

export type RunDeps = {
  root: ParentNode;
  resolver: Resolver;
  navigate(path: string): Promise<NavigateOutcome>;
  confirm(steps: Step[]): Promise<boolean>;
  isMutating(step: Step, element: Element | null): boolean;
  pageConfirms?: boolean;
  page(): PageInfo;
  now(): number;
  wait?: WaitOptions;
  cache?: ObservationCache;
};

export type TraceItem = {
  action: Step["action"] | "plan";
  target?: Target;
  to?: string;
  ok: boolean;
  ms: number;
  mode?: NavigateMode;
  error?: AdminErrorCode;
  detail?: string;
  candidates?: Candidate[];
  summary?: string;
  data?: unknown;
  page?: Snapshot;
  opened?: "confirmation";
};

export type RunResult = { ok: boolean; trace: TraceItem[]; page: Snapshot; stopped?: "confirmation"; remaining?: Step[] };

type StepOutcome = ActionResult & { mode?: NavigateMode; candidates?: Candidate[]; opened?: "confirmation" };

const USER_DECIDES_IN_DIALOG = "the page is asking the user to confirm; the user decides in the dialog";

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], dialog[open]';
const ALERT_SELECTOR = '[role="alert"]';

function isPath(to: string) {
  return isRoute(to);
}

function linkForPath(root: ParentNode, path: string): HTMLAnchorElement | null {
  const wanted = routePath(path);
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));
  return links.find((link) => routePath(link.getAttribute("href") ?? "") === wanted) ?? null;
}

function countDialogs(root: ParentNode) {
  return root.querySelectorAll(DIALOG_SELECTOR).length;
}

function alertsIn(root: ParentNode): Set<Element> {
  return new Set(root.querySelectorAll(ALERT_SELECTOR));
}

function newAlertText(root: ParentNode, before: Set<Element>): string | undefined {
  const added = Array.from(root.querySelectorAll(ALERT_SELECTOR)).find((alert) => !before.has(alert));
  return added ? collapse(added.textContent) : undefined;
}

function readField(element: Element): ActionResult {
  if (element.tagName === "TABLE") return readTable(element);
  if (isSensitive(element)) return failure("ACTION_NOT_ALLOWED", "the value of a sensitive field is never read");
  const value = (element as HTMLInputElement).value;
  if (typeof value !== "string") return failure("NOT_SUPPORTED", `${element.tagName.toLowerCase()} has no readable value`);
  return { ok: true, summary: "Read value", data: collapse(value) };
}

function resolveFailure(resolved: { ok: false; error: AdminErrorCode; detail?: string; candidates?: Candidate[] }): StepOutcome {
  const outcome: StepOutcome = failure(resolved.error, resolved.detail);
  if (resolved.candidates) outcome.candidates = resolved.candidates;
  return outcome;
}

function targetOf(step: Step): Target | undefined {
  return "target" in step ? step.target : undefined;
}

/** The route changed; a router still has to render it (a hash change is instant, the screen is not), so wait until the DOM settles before the next step reads it. */
async function arrive(summary: string, before: string, deps: RunDeps): Promise<StepOutcome> {
  const arrived = await waitForNavigation(deps.page, before, deps.wait);
  if (!arrived.ok) return arrived;
  await waitForIdle(deps.root, deps.wait);
  return { ok: true, summary, mode: "router" };
}

async function clickLinkAndArrive(link: Element, summary: string, before: string, deps: RunDeps): Promise<StepOutcome> {
  const clicked = click(link);
  if (!clicked.ok) return clicked;
  return arrive(summary, before, deps);
}

async function navigateStep(to: string, deps: RunDeps): Promise<StepOutcome> {
  const before = deps.page().path;
  if (!isPath(to)) {
    const named = deps.resolver.resolve({ role: "link", name: to }, deps.root);
    if (!named.ok) return resolveFailure(named);
    return clickLinkAndArrive(named.element, `Opened link ${to}`, before, deps);
  }
  const link = linkForPath(deps.root, to);
  if (link) return clickLinkAndArrive(link, `Opened ${to}`, before, deps);
  const outcome = await deps.navigate(to);
  if (!outcome.ok) return failure("ROUTE_NOT_FOUND", `no link to ${to} on this page and the host cannot route there`);
  if (outcome.mode === "reload") return { ok: true, summary: `Loading ${to}`, mode: "reload" };
  return arrive(`Opened ${to}`, before, deps);
}

function withOpenedConfirmation(outcome: StepOutcome, root: ParentNode, before: Set<Element>): StepOutcome {
  if (!outcome.ok || !newConfirmationDialog(root, before)) return outcome;
  return { ...outcome, opened: "confirmation" };
}

async function submitStep(element: Element, deps: RunDeps): Promise<StepOutcome> {
  const alertsBefore = alertsIn(deps.root);
  const form = element.tagName === "FORM" ? element : element.closest("form");
  const result = submit(element);
  if (!result.ok) return result;
  await waitForIdle(deps.root, deps.wait);
  const alert = newAlertText(deps.root, alertsBefore);
  if (form?.isConnected && alert !== undefined) return failure("SUBMIT_FAILED", alert);
  return result;
}

function pathLinkTarget(element: Element, currentPath: string): string | null {
  if (element.tagName !== "A") return null;
  const target = routePath(element.getAttribute("href") ?? "");
  if (target === null || target === currentPath) return null;
  return target;
}

async function clickStep(element: Element, deps: RunDeps): Promise<StepOutcome> {
  const before = deps.page().path;
  const leavesPage = pathLinkTarget(element, before) !== null;
  const dialogsBefore = countDialogs(deps.root);
  const result = click(element);
  if (!result.ok) return result;
  if (leavesPage) return arrive(result.summary, before, deps);
  if (countDialogs(deps.root) > dialogsBefore) await waitForIdle(deps.root, deps.wait);
  return result;
}

async function noticingConfirmation(root: ParentNode, act: () => Promise<StepOutcome>): Promise<StepOutcome> {
  const before = new Set(confirmationDialogsIn(root));
  const outcome = await settled(await act());
  return withOpenedConfirmation(outcome, root, before);
}

async function waitStep(kind: "navigation" | "idle", deps: RunDeps): Promise<StepOutcome> {
  if (kind === "idle") {
    const idle = await waitForIdle(deps.root, deps.wait);
    return { ok: true, summary: idle.settled ? "Page settled" : "Page kept changing" };
  }
  const arrived = await waitForNavigation(deps.page, deps.page().path, deps.wait);
  return arrived.ok ? { ok: true, summary: "Navigated" } : arrived;
}

function afterRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function settled(outcome: StepOutcome): Promise<StepOutcome> {
  await afterRender();
  return outcome;
}

async function performOnElement(step: Step, element: Element, deps: RunDeps): Promise<StepOutcome> {
  switch (step.action) {
    case "click":
      return noticingConfirmation(deps.root, () => clickStep(element, deps));
    case "fill":
      return settled(fill(element, step.value));
    case "select":
      return settled(await select(element, step.value));
    case "check":
      return settled(check(element, step.checked));
    case "submit":
      return noticingConfirmation(deps.root, () => submitStep(element, deps));
    case "read":
      return readField(element);
    default:
      return failure("NOT_SUPPORTED");
  }
}

function traceItem(step: Step, outcome: StepOutcome, ms: number): TraceItem {
  const item: TraceItem = { action: step.action, ok: outcome.ok, ms };
  const target = targetOf(step);
  if (target !== undefined) item.target = target;
  if (step.action === "navigate") item.to = step.to;
  if (outcome.mode) item.mode = outcome.mode;
  if (outcome.opened) item.opened = outcome.opened;
  if (outcome.ok) {
    item.summary = outcome.summary;
    if (outcome.data !== undefined) item.data = outcome.data;
    return item;
  }
  item.error = outcome.error;
  if (outcome.detail) item.detail = outcome.detail;
  if (outcome.candidates) item.candidates = outcome.candidates;
  return item;
}

type Execution = { trace: TraceItem[]; confirmed: boolean };

function declined(step: Step, deps: RunDeps, started: number): TraceItem {
  return traceItem(step, failure("DECLINED", "the user declined to run these steps"), deps.now() - started);
}

function withArrivedPage(item: TraceItem, deps: RunDeps): TraceItem {
  if (!item.ok || item.mode !== "router") return item;
  return { ...item, page: capturePage(deps) };
}

async function executeStep(step: Step, index: number, steps: Step[], deps: RunDeps, execution: Execution): Promise<TraceItem> {
  const started = deps.now();
  if (step.action === "navigate") return withArrivedPage(traceItem(step, await navigateStep(step.to, deps), deps.now() - started), deps);
  if (step.action === "wait") return traceItem(step, await waitStep(step.for, deps), deps.now() - started);
  const resolved = deps.resolver.resolve(step.target, deps.root);
  if (!resolved.ok) return traceItem(step, resolveFailure(resolved), deps.now() - started);
  if (deps.pageConfirms && insideConfirmationDialog(resolved.element)) {
    return traceItem(step, failure("ACTION_NOT_ALLOWED", USER_DECIDES_IN_DIALOG), deps.now() - started);
  }
  if (!deps.pageConfirms && !execution.confirmed && deps.isMutating(step, resolved.element)) {
    execution.confirmed = true;
    const approved = await deps.confirm(steps.slice(index));
    if (!approved) return declined(step, deps, started);
  }
  return withArrivedPage(traceItem(step, await performOnElement(step, resolved.element, deps), deps.now() - started), deps);
}

/** The result every admin_run path returns for a plan that fails validation, so the runner and the browser answer alike. */
export function invalidPlanResult(detail: string, page: Snapshot): RunResult {
  const item: TraceItem = { action: "plan", ok: false, ms: 0, error: "PLAN_INVALID", detail };
  return { ok: false, trace: [item], page };
}

/** Snapshots the page, makes its refs resolvable and records it in the observation cache when there is one. */
export function capturePage(deps: Pick<RunDeps, "root" | "page" | "resolver" | "now" | "cache">): Snapshot {
  const capture = snapshot(deps.root, deps.page());
  deps.resolver.remember(capture);
  deps.cache?.remember(capture.snapshot, deps.now(), collectLinks(deps.root));
  return capture.snapshot;
}

export async function runPlan(input: unknown, deps: RunDeps): Promise<RunResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return invalidPlanResult(describePlanIssue(input, parsed.error.issues[0]), capturePage(deps));
  const steps = parsed.data.steps;
  const execution: Execution = { trace: [], confirmed: false };
  for (const [index, step] of steps.entries()) {
    const item = await executeStep(step, index, steps, deps, execution);
    execution.trace.push(item);
    if (!item.ok) break;
    if (deps.pageConfirms && item.opened === "confirmation") return stoppedForConfirmation(execution.trace, steps.slice(index + 1), deps);
  }
  const ok = execution.trace.every((item) => item.ok);
  return { ok, trace: execution.trace, page: capturePage(deps) };
}

function stoppedForConfirmation(trace: TraceItem[], remaining: Step[], deps: RunDeps): RunResult {
  return { ok: true, trace, page: capturePage(deps), stopped: "confirmation", remaining };
}
