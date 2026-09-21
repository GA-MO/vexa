import { jsonSchema, type FlexibleSchema } from "ai";
import { z } from "zod";
import { createObservationCache, type ObservationCache, type RouteEntry } from "./cache";
import type { DiscoveryProgress } from "./discover";
import { ADMIN_TOOLS } from "./names";
import type { Resolver } from "./resolve";
import { capturePage, runPlan, type NavigateOutcome, type RunDeps, type RunResult, type TraceItem } from "./run";
import { planJsonSchema, type Plan, type Step, type Target } from "./schema";
import { accessibleName, roleOf, type PageInfo, type Snapshot } from "./snapshot";
import type { AdminPages } from "./seed";

export type AdminToolResult =
  | { ok: true; summary?: string; data?: unknown }
  | { ok: false; error: string; data?: unknown };

export type AdminToolContext = { toolCallId: string | null; source: "model" | "button" };

export type AdminHostTool<I = unknown> = {
  description: string;
  input?: FlexibleSchema<I>;
  confirm?: boolean;
  run(input: I, ctx: AdminToolContext): AdminToolResult | Promise<AdminToolResult>;
};

export type AdminConfirmPolicy = "page" | "mutating" | "all" | "none" | ((step: Step, element: Element | null) => boolean);

export type AdminSyncMode = "auto" | "manual" | "off";

/** "auto" (default): the pages are discovered in a hidden frame after load and kept per origin; "model": only when the model asks; "off": never. */
export type AdminDiscoverMode = "auto" | "model" | "off";

export type AdminDiscoverOptions = {
  mode?: AdminDiscoverMode;
  ttlMs?: number;
  limit?: number;
  skip?: (path: string) => boolean;
};

/** Opt-in page driving: `confirm` decides who approves a change (default "page": the app's own dialog, never a Vexa card), `navigate` routes to a path with no link on the page, `passive` (default true) remembers every page the user visits, `discover` (default "auto") learns the rest in a hidden frame, `scope` names the signed-in user so what was discovered is kept for them alone, `version` invalidates what an earlier build discovered, `pages` seeds the memory from a file. */
export type AdminOptions = {
  confirm?: AdminConfirmPolicy;
  navigate?: (path: string) => void | Promise<void>;
  passive?: boolean;
  discover?: AdminDiscoverMode | AdminDiscoverOptions;
  scope?: string;
  version?: string;
  pages?: AdminPages;
  sync?: AdminSyncMode;
};

export type DiscoverRequest = { limit?: number };

export type DiscoverOutcome =
  | { ok: true; progress: DiscoveryProgress; cached?: boolean }
  | { ok: false; detail: string };

export type AdminToolDeps = {
  root: () => ParentNode;
  page: () => PageInfo;
  resolver: Resolver;
  confirm: (steps: Step[]) => Promise<boolean>;
  options: () => AdminOptions;
  cache?: ObservationCache;
  discover?: (request: DiscoverRequest) => Promise<DiscoverOutcome>;
};

export const DISCOVER_REQUEST_LIMIT = 25;

const discoverInputSchema = z
  .object({ limit: z.number().int().min(1).max(DISCOVER_REQUEST_LIMIT).optional().describe("Most pages to look at") })
  .strict();

export type DiscoverInput = z.infer<typeof discoverInputSchema>;

const DISCOVER_INPUT_JSON_SCHEMA = z.toJSONSchema(discoverInputSchema) as Record<string, unknown>;

export type PageIndex = { routes: RouteEntry[]; observed: string[] };

export type ObserveResult = Snapshot & PageIndex & { cached?: true; observedAt?: string };

const observeInputSchema = z
  .object({ path: z.string().min(1).max(200).optional().describe("A path you visited or discovered; omit for the current page") })
  .strict();

export type ObserveInput = z.infer<typeof observeInputSchema>;

const OBSERVE_INPUT_JSON_SCHEMA = z.toJSONSchema(observeInputSchema) as Record<string, unknown>;

export const DEFAULT_CONFIRM_POLICY: AdminConfirmPolicy = "page";

export type AdminToolDescriptor = { name: string; description: string; inputSchema: Record<string, unknown> };

export const DESTRUCTIVE_NAMES = /^(delete|remove|archive|unpublish|publish|discard|revoke|reset)\b/i;

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], dialog[open]';

const OBSERVE_DESCRIPTION =
  "Returns a page: elements with ref, role, name and state, plus routes (pages that exist) and observed (pages readable without going there). No path = the current page; a visited path answers from memory. Call it before acting on a page you have not seen.";

const DISCOVER_DESCRIPTION =
  "Looks through the app's pages in a hidden frame without moving the user, then returns routes and observed pages. Use it when a page you need is not in observed and you do not know where something is.";

const RUN_DESCRIPTION =
  "Runs page steps in order (navigate, click, fill, select, check, submit, read, wait) and stops at the first failure. Returns a trace per step and the page afterwards. When a click opens the app's confirmation dialog the run stops there; the user decides in it.";

function isSubmitButton(element: Element) {
  return element.tagName === "BUTTON" && (element as HTMLButtonElement).type === "submit";
}

function isMutatingClick(element: Element | null) {
  if (!element) return false;
  if (element.closest(DIALOG_SELECTOR)) return true;
  if (isSubmitButton(element)) return true;
  const role = roleOf(element) ?? "button";
  return DESTRUCTIVE_NAMES.test(accessibleName(element, role));
}

export function isMutatingStep(step: Step, element: Element | null): boolean {
  if (step.action === "submit") return true;
  if (step.action === "click") return isMutatingClick(element);
  return false;
}

function policyToPredicate(policy: AdminConfirmPolicy): RunDeps["isMutating"] {
  if (typeof policy === "function") return policy;
  if (policy === "all") return () => true;
  if (policy === "none" || policy === "page") return () => false;
  return isMutatingStep;
}

function describeTarget(target: Target): string {
  if (typeof target === "string") return `the selected element ${target}`;
  return target.name;
}

function describeStep(step: Step): string {
  switch (step.action) {
    case "navigate":
      return `Open ${step.to}`;
    case "click":
      return `Click ${describeTarget(step.target)}`;
    case "fill":
      return `Fill ${describeTarget(step.target)} with "${step.value}"`;
    case "select":
      return `Select ${step.value} in ${describeTarget(step.target)}`;
    case "check":
      return `${step.checked ? "Check" : "Uncheck"} ${describeTarget(step.target)}`;
    case "submit":
      return `Submit ${describeTarget(step.target)}`;
    case "read":
      return `Read ${describeTarget(step.target)}`;
    case "wait":
      return step.for === "navigation" ? "Wait for the page to change" : "Wait for the page to settle";
  }
}

/** One short sentence per step, for confirmation cards and traces. */
export function describeSteps(steps: Step[]): string[] {
  return steps.map(describeStep);
}

function navigateDep(navigate: AdminOptions["navigate"]): RunDeps["navigate"] {
  if (!navigate) return async () => ({ ok: false });
  return async (path: string): Promise<NavigateOutcome> => {
    await navigate(path);
    return { ok: true, mode: "router" };
  };
}

function runDeps(deps: AdminToolDeps): RunDeps {
  const options = deps.options();
  const policy = options.confirm ?? DEFAULT_CONFIRM_POLICY;
  return {
    root: deps.root(),
    resolver: deps.resolver,
    navigate: navigateDep(options.navigate),
    confirm: deps.confirm,
    isMutating: policyToPredicate(policy),
    pageConfirms: policy === "page",
    page: deps.page,
    now: () => Date.now(),
  };
}

function failedStep(trace: TraceItem[]): { index: number; item: TraceItem } | null {
  const index = trace.findIndex((item) => !item.ok);
  return index === -1 ? null : { index, item: trace[index] };
}

/** One sentence for a completed admin_run, used as the tool result summary. */
export function runSummary(result: RunResult): string {
  if (result.stopped === "confirmation") {
    const notRun = result.remaining?.length ?? 0;
    return `Stopped: the page is asking the user to confirm (${notRun} steps not run)`;
  }
  const done = result.trace.filter((item) => item.ok).length;
  return `${done} of ${result.trace.length} steps done on ${result.page.path}`;
}

/** The error line for a failed admin_run: code, step number and detail. */
export function runError(result: RunResult): string {
  const failed = failedStep(result.trace);
  if (!failed) return "the plan did not complete";
  const detail = failed.item.detail ? `: ${failed.item.detail}` : "";
  return `${failed.item.error} at step ${failed.index + 1}${detail}`;
}

function pageIndex(cache: ObservationCache): PageIndex {
  return { routes: cache.routes(), observed: cache.observed() };
}

function samePath(a: string, b: string) {
  return a.split(/[?#]/)[0] === b.split(/[?#]/)[0];
}

function observeLive(deps: AdminToolDeps, cache: ObservationCache): ObserveResult {
  const page = capturePage({ root: deps.root(), page: deps.page, resolver: deps.resolver, now: () => Date.now(), cache });
  return { ...page, ...pageIndex(cache) };
}

function observePath(path: string, deps: AdminToolDeps, cache: ObservationCache): AdminToolResult {
  if (samePath(path, deps.page().path)) return { ok: true, data: observeLive(deps, cache) };
  const cached = cache.get(path);
  if (!cached) {
    return { ok: false, error: `PAGE_NOT_OBSERVED: ${path} has not been visited; navigate there or run discovery`, data: pageIndex(cache) };
  }
  const { observedAt, ...page } = cached;
  const data: ObserveResult = { ...page, cached: true, observedAt: new Date(observedAt).toISOString(), ...pageIndex(cache) };
  return { ok: true, data };
}

function discoverSummary(outcome: Extract<DiscoverOutcome, { ok: true }>, cache: ObservationCache): string {
  if (outcome.cached) return `${cache.observed().length} pages known`;
  return `${outcome.progress.visited.length} pages looked at`;
}

function discoverTool(deps: AdminToolDeps, cache: ObservationCache): AdminHostTool<DiscoverInput> {
  const discover = deps.discover;
  return {
    description: DISCOVER_DESCRIPTION,
    input: jsonSchema<DiscoverInput>(DISCOVER_INPUT_JSON_SCHEMA),
    run: async (input, ctx) => {
      if (ctx.source === "button") return { ok: false, error: "ACTION_NOT_ALLOWED: admin_discover only runs from a model turn" };
      if (!discover) return { ok: false, error: "DISCOVERY_UNAVAILABLE: discovery is off for this app", data: pageIndex(cache) };
      const outcome = await discover({ limit: typeof input?.limit === "number" ? input.limit : undefined });
      if (!outcome.ok) return { ok: false, error: `DISCOVERY_UNAVAILABLE: ${outcome.detail}`, data: pageIndex(cache) };
      const data = { ...pageIndex(cache), visited: outcome.progress.visited, ...(outcome.cached ? { cached: true as const } : {}) };
      return { ok: true, summary: discoverSummary(outcome, cache), data };
    },
  };
}

/** The host tools that let the model drive the page: `admin_observe`, `admin_run` and `admin_discover`. */
export function createAdminTools(deps: AdminToolDeps): Record<string, AdminHostTool> {
  const cache = deps.cache ?? createObservationCache();
  const observeTool: AdminHostTool<ObserveInput> = {
    description: OBSERVE_DESCRIPTION,
    input: jsonSchema<ObserveInput>(OBSERVE_INPUT_JSON_SCHEMA),
    run: (input) => {
      const path = typeof input?.path === "string" ? input.path : undefined;
      if (path === undefined) return { ok: true, data: observeLive(deps, cache) };
      return observePath(path, deps, cache);
    },
  };
  const runTool: AdminHostTool<Plan> = {
    description: RUN_DESCRIPTION,
    input: jsonSchema<Plan>(planJsonSchema),
    run: async (input, ctx) => {
      if (ctx.source === "button") return { ok: false, error: "ACTION_NOT_ALLOWED: admin_run only runs from a model turn" };
      const result = await runPlan(input, { ...runDeps(deps), cache });
      const data = { ...result, ...pageIndex(cache) };
      if (result.ok) return { ok: true, summary: runSummary(result), data };
      return { ok: false, error: runError(result), data };
    },
  };
  const tools: Record<string, AdminHostTool> = {
    [ADMIN_TOOLS.observe]: observeTool as AdminHostTool,
    [ADMIN_TOOLS.run]: runTool as AdminHostTool,
  };
  if (deps.discover) tools[ADMIN_TOOLS.discover] = discoverTool(deps, cache) as AdminHostTool;
  return tools;
}

/** The descriptors the provider sends for the admin tools, for test runners that talk to the chat route without a browser. */
export function adminToolDescriptors(): AdminToolDescriptor[] {
  return [
    { name: ADMIN_TOOLS.observe, description: OBSERVE_DESCRIPTION, inputSchema: OBSERVE_INPUT_JSON_SCHEMA },
    { name: ADMIN_TOOLS.run, description: RUN_DESCRIPTION, inputSchema: planJsonSchema },
    { name: ADMIN_TOOLS.discover, description: DISCOVER_DESCRIPTION, inputSchema: DISCOVER_INPUT_JSON_SCHEMA },
  ];
}
