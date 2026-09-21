"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { asSchema, type FlexibleSchema, type InferSchema } from "ai";
import type { ComputedFunction } from "@json-render/core";
import {
  DEFAULT_LABELS,
  type ChatComposerOptions,
  type ChatLabels,
  type ChatModel,
  type ChatStepsDisplay,
  type ChatSuggestion,
} from "../chat/constants";
import { PortalContainerContext } from "../lib/portal";
import { ADMIN_TOOLS, isAdminToolName } from "../admin/names";
import { createResolver, type Resolver } from "../admin/resolve";
import { currentPage } from "../admin/snapshot";
import { createObservationCache, type ObservationCache, type RouteEntry } from "../admin/cache";
import { IDLE_DISCOVERY, DISCOVERY_PAGE_LIMIT, type DiscoverOptions, type DiscoveryProgress } from "../admin/discover";
import { createFrameHost, discoverInFrame, isVexaFrame, type FrameHost } from "../admin/frame";
import { watchPages } from "../admin/passive";
import { exportPages, importPages, toPagesFile, type AdminPages, type ImportPagesResult } from "../admin/seed";
import { loadStoredPages, storePages, STORED_PAGES_TTL_MS } from "../admin/store";
import { fetchPagesEndpoint, savePagesFile, watchPagesFile, type SavePagesResult } from "../admin/sync";
import {
  createAdminTools,
  describeSteps,
  type AdminConfirmPolicy,
  type AdminDiscoverMode,
  type AdminOptions,
  type AdminSyncMode,
  type DiscoverOutcome,
  type DiscoverRequest,
} from "../admin/tools";
export type { AdminOptions } from "../admin/tools";
import type { Step } from "../admin/schema";
import { createFormatter, DEFAULT_FORMAT, type Formatter, type VexaFormat } from "./format";
import { themeStyle, type VexaTheme } from "./theme";

export type HostToolResult =
  | { ok: true; summary?: string; data?: unknown }
  | { ok: false; error: string; data?: unknown };

export type HostToolContext = {
  toolCallId: string | null;
  source: "model" | "button";
};

export type HostTool<I = unknown> = {
  description: string;
  input?: FlexibleSchema<I>;
  confirm?: boolean;
  run(input: I, ctx: HostToolContext): HostToolResult | Promise<HostToolResult>;
};

export type HostToolDescriptor = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type PendingConfirmation = {
  id: string;
  name: string;
  input: unknown;
  description: string;
  steps?: string[];
};

export type VexaChatDefaults = {
  labels?: Partial<ChatLabels>;
  steps?: ChatStepsDisplay;
  composer?: ChatComposerOptions;
  logo?: ReactNode;
  launcherIcon?: ReactNode;
  title?: string;
  subtitle?: string;
  models?: readonly ChatModel[];
  defaultModel?: string;
  suggestions?: readonly ChatSuggestion[];
  launcherLabel?: string;
  position?: "bottom-right" | "bottom-left";
  defaultOpen?: boolean;
  backdrop?: boolean;
};

export type VexaAdminValue = {
  enabled: boolean;
  discover: (options?: DiscoverOptions) => Promise<DiscoveryProgress>;
  progress: DiscoveryProgress;
  blocked: string | null;
  routes: RouteEntry[];
  observed: string[];
  exportPages: () => AdminPages;
  importPages: (data: unknown) => ImportPagesResult;
  canSave: boolean;
  save: () => Promise<SavePagesResult>;
  clear: () => void;
};

export type VexaHostValue = {
  api: string;
  admin: VexaAdminValue;
  chat: VexaChatDefaults;
  formatter: Formatter;
  functions: Record<string, ComputedFunction>;
  tools: Record<string, HostTool>;
  schemas: HostToolDescriptor[];
  readContext: () => Promise<Record<string, unknown>>;
  runTool: (name: string, input: unknown, ctx: HostToolContext) => Promise<HostToolResult>;
  hasTool: (name: string) => boolean;
  pending: PendingConfirmation[];
  resolveConfirmation: (id: string, approved: boolean) => void;
  sendToChat: (text: string) => boolean;
  registerChatSender: (send: ((text: string) => void) | null) => void;
};

type VexaProviderBaseProps = {
  api?: string;
  chat?: VexaChatDefaults;
  format?: Partial<VexaFormat>;
  functions?: Record<string, ComputedFunction>;
  theme?: VexaTheme;
  tools?: Record<string, HostTool>;
  admin?: boolean | AdminOptions;
  onToolResult?: (name: string, result: HostToolResult) => void;
  children: ReactNode;
};

const TOOL_NAME = /^[a-z][a-z0-9_]{0,63}$/;
const RESERVED_ACTION_NAMES = new Set([
  "setState",
  "pushState",
  "removeState",
  "push",
  "runTool",
  "submitForm",
  "toast",
]);
const EMPTY_INPUT_SCHEMA = { type: "object", properties: {}, additionalProperties: false };

const VexaHostContext = createContext<VexaHostValue | null>(null);

type ToolWithoutInput = Omit<HostTool<Record<string, never>>, "input"> & { input?: undefined };

/** Accepts any Standard Schema (zod, valibot, arktype, …) or an AI SDK jsonSchema(); run receives the inferred input. */
export function defineTool<S extends FlexibleSchema<Record<string, unknown>>>(
  tool: Omit<HostTool<InferSchema<S>>, "input"> & { input: S },
): HostTool<InferSchema<S>>;
export function defineTool(tool: ToolWithoutInput): HostTool<Record<string, never>>;
export function defineTool(tool: HostTool<never> | ToolWithoutInput): HostTool<never> {
  return tool as HostTool<never>;
}

function assertToolNames(tools: Record<string, HostTool>) {
  for (const name of Object.keys(tools)) {
    if (!TOOL_NAME.test(name)) {
      throw new Error(`Vexa host tool "${name}" must match ${TOOL_NAME}`);
    }
    if (isAdminToolName(name)) {
      throw new Error(`Vexa host tool "${name}" uses the reserved admin_ prefix; enable page driving with the admin prop instead`);
    }
    if (RESERVED_ACTION_NAMES.has(name)) {
      throw new Error(`Vexa host tool "${name}" collides with a built-in spec action`);
    }
  }
}

async function toolSchemas(tools: Record<string, HostTool>): Promise<HostToolDescriptor[]> {
  return Promise.all(
    Object.entries(tools).map(async ([name, tool]) => ({
      name,
      description: tool.description.slice(0, 300),
      inputSchema: tool.input
        ? ((await asSchema(tool.input).jsonSchema) as Record<string, unknown>)
        : EMPTY_INPUT_SCHEMA,
    })),
  );
}

async function validateWith<T>(schema: FlexibleSchema<T>, value: unknown): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  const validate = asSchema(schema).validate;
  if (!validate) return { ok: true, value: value as T };
  const result = await validate(value);
  if (result.success) return { ok: true, value: result.value };
  return { ok: false, error: result.error.message };
}

async function parseInput(tool: HostTool, input: unknown) {
  if (!tool.input) return { ok: true as const, value: input ?? {} };
  const result = await validateWith(tool.input, input ?? {});
  return result.ok ? result : { ok: false as const, error: `Invalid input: ${result.error}` };
}

export type ContextSchema = FlexibleSchema<Record<string, unknown>>;

type ContextProps<S extends ContextSchema> =
  | { contextSchema: S; context: () => InferSchema<S> }
  | { contextSchema?: undefined; context?: undefined };

export type VexaProviderProps<S extends ContextSchema = ContextSchema> = VexaProviderBaseProps & ContextProps<S>;

const NO_CHAT_DEFAULTS: VexaChatDefaults = {};
const NO_FUNCTIONS: Record<string, ComputedFunction> = {};
const NO_TOOLS: Record<string, HostTool> = {};
const NO_ADMIN: AdminOptions | null = null;
const DEFAULT_ADMIN: AdminOptions = {};

function adminOptionsOf(admin: boolean | AdminOptions | undefined, inFrame: boolean): AdminOptions | null {
  if (!admin || inFrame) return NO_ADMIN;
  return admin === true ? DEFAULT_ADMIN : admin;
}

/** False on the server and on the first client render (so hydration matches), true once mounted inside the hidden discovery frame. */
function useInDiscoveryFrame(): boolean {
  const [inFrame, setInFrame] = useState(false);
  useEffect(() => {
    if (isVexaFrame()) setInFrame(true);
  }, []);
  return inFrame;
}

type ConfirmRequest = (name: string, input: unknown, description: string, steps?: string[]) => Promise<boolean>;

type AdminRuntime = {
  resolver: Resolver;
  cache: ObservationCache;
  createdAt: number;
  frame: FrameHost | null;
  plansRunning: number;
  discoveredAt: number | null;
  blocked: string | null;
  inFlight: Promise<DiscoverOutcome> | null;
};

type DiscoverSettings = { mode: AdminDiscoverMode; ttlMs: number; limit: number; skip?: (path: string) => boolean };

const DEFAULT_DISCOVER_MODE: AdminDiscoverMode = "auto";
const API_PATH = /\/api\//;
const AUTO_DISCOVERY_DELAY_MS = 2000;
const AUTO_DISCOVERY_RETRY_MS = 2000;
const AUTO_DISCOVERY_RETRIES = 15;

function discoverSettingsOf(admin: AdminOptions | null): DiscoverSettings {
  const raw = admin?.discover;
  const options = typeof raw === "string" ? { mode: raw } : (raw ?? {});
  return {
    mode: options.mode ?? DEFAULT_DISCOVER_MODE,
    ttlMs: options.ttlMs ?? STORED_PAGES_TTL_MS,
    limit: options.limit ?? DISCOVERY_PAGE_LIMIT,
    skip: options.skip,
  };
}

function skipWith(custom: ((path: string) => boolean) | undefined): (path: string) => boolean {
  return (path) => API_PATH.test(path) || (custom?.(path) ?? false);
}

function storedPlace(admin: AdminOptions): { origin: string; scope?: string } {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return admin.scope ? { origin, scope: admin.scope } : { origin };
}

function seededCache(admin: AdminOptions | null): ObservationCache {
  const cache = createObservationCache();
  if (!admin?.pages) return cache;
  const result = importPages(cache, admin.pages);
  if (!result.ok) console.warn(`VexaProvider: admin.pages ignored, ${result.error}`);
  return cache;
}

function createAdminRuntime(admin: AdminOptions | null): AdminRuntime {
  return {
    resolver: createResolver(),
    cache: seededCache(admin),
    createdAt: Date.now(),
    frame: null,
    plansRunning: 0,
    discoveredAt: null,
    blocked: null,
    inFlight: null,
  };
}

function restoreStoredPages(runtime: AdminRuntime, admin: AdminOptions) {
  const settings = discoverSettingsOf(admin);
  if (settings.mode === "off" || runtime.discoveredAt !== null) return;
  const stored = loadStoredPages(storedPlace(admin), { version: admin.version, ttlMs: settings.ttlMs });
  if (!stored) return;
  importPages(runtime.cache, stored.file, stored.storedAt);
  runtime.discoveredAt = stored.storedAt;
  console.debug(`[vexa] pages restored (${stored.file.pages.length})`);
}

function useAdminRuntime(admin: AdminOptions | null): AdminRuntime {
  const runtime = useRef<AdminRuntime | null>(null);
  runtime.current ??= createAdminRuntime(admin);
  const optionsRef = useRef(admin);
  optionsRef.current = admin;
  const enabled = admin !== null;
  const passive = admin?.passive !== false;
  useEffect(() => {
    if (enabled && !isVexaFrame()) restoreStoredPages(runtime.current as AdminRuntime, optionsRef.current ?? DEFAULT_ADMIN);
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !passive || isVexaFrame()) return;
    return watchPages({ root: () => document.body, page: () => currentPage(), cache: (runtime.current as AdminRuntime).cache });
  }, [enabled, passive]);
  return runtime.current;
}

function isFresh(runtime: AdminRuntime, ttlMs: number): boolean {
  return runtime.discoveredAt !== null && Date.now() - runtime.discoveredAt <= ttlMs;
}

function freshOutcome(runtime: AdminRuntime): DiscoverOutcome {
  return { ok: true, cached: true, progress: { status: "done", visited: runtime.cache.observed(), pending: 0, errors: [] } };
}

type FrameDiscoverRequest = DiscoverRequest & { skip?: (path: string) => boolean; onProgress?: (progress: DiscoveryProgress) => void };

async function discoverThroughFrame(runtime: AdminRuntime, admin: AdminOptions, request: FrameDiscoverRequest): Promise<DiscoverOutcome> {
  if (runtime.blocked) return { ok: false, detail: runtime.blocked };
  if (runtime.inFlight) return runtime.inFlight;
  const settings = discoverSettingsOf(admin);
  runtime.frame ??= createFrameHost({ onBlocked: (reason) => (runtime.blocked = reason) });
  const run = discoverInFrame(
    { frame: runtime.frame, cache: runtime.cache, startPath: currentPage().path },
    { limit: request.limit ?? settings.limit, skip: skipWith(request.skip ?? settings.skip), onProgress: request.onProgress },
  ).then((result): DiscoverOutcome => {
    if (!result.ok) return { ok: false, detail: result.detail };
    runtime.discoveredAt = Date.now();
    storePages(storedPlace(admin), toPagesFile(runtime.cache), { version: admin.version });
    return { ok: true, progress: result.progress };
  });
  runtime.inFlight = run;
  try {
    return await run;
  } finally {
    runtime.inFlight = null;
  }
}

function scheduleIdle(callback: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const handle = requestIdleCallback(callback, { timeout: AUTO_DISCOVERY_DELAY_MS });
    return () => cancelIdleCallback(handle);
  }
  const timer = setTimeout(callback, AUTO_DISCOVERY_DELAY_MS);
  return () => clearTimeout(timer);
}

function useAutoDiscovery(admin: AdminOptions | null, runtime: AdminRuntime, report: (progress: DiscoveryProgress) => void) {
  const optionsRef = useRef(admin);
  optionsRef.current = admin;
  const mode = discoverSettingsOf(admin).mode;
  const enabled = admin !== null;
  useEffect(() => {
    if (!enabled || mode !== "auto" || isVexaFrame()) return;
    let cancelled = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      if (cancelled || runtime.blocked || isFresh(runtime, discoverSettingsOf(optionsRef.current).ttlMs)) return;
      if (runtime.plansRunning > 0 && retries < AUTO_DISCOVERY_RETRIES) {
        retries += 1;
        retryTimer = setTimeout(start, AUTO_DISCOVERY_RETRY_MS);
        return;
      }
      console.debug("[vexa] discovering");
      void discoverThroughFrame(runtime, optionsRef.current ?? DEFAULT_ADMIN, { onProgress: report }).then((outcome) => {
        if (cancelled) return;
        if (!outcome.ok) report({ status: "failed", visited: runtime.cache.observed(), pending: 0, errors: [{ path: currentPage().path, error: "DISCOVERY_UNAVAILABLE" }] });
      });
    };
    const cancelIdle = scheduleIdle(start);
    return () => {
      cancelled = true;
      cancelIdle();
      clearTimeout(retryTimer);
      runtime.frame?.close();
    };
  }, [enabled, mode, runtime, report]);
}

const DEFAULT_SYNC: AdminSyncMode = "auto";

function usePagesFileSync(api: string, admin: AdminOptions | null, runtime: AdminRuntime): boolean {
  const enabled = admin !== null;
  const sync = admin?.sync ?? DEFAULT_SYNC;
  const [canSave, setCanSave] = useState(false);
  useEffect(() => {
    if (!enabled || isVexaFrame()) return;
    let active = true;
    void fetchPagesEndpoint(api).then((info) => {
      if (!active) return;
      if (info.pages) importPages(runtime.cache, info.pages, runtime.createdAt);
      setCanSave(info.writable && sync !== "off");
    });
    return () => {
      active = false;
    };
  }, [api, enabled, sync, runtime]);
  useEffect(() => {
    if (!enabled || !canSave || sync !== "auto") return;
    return watchPagesFile({ api, cache: runtime.cache });
  }, [api, enabled, canSave, sync, runtime]);
  return canSave;
}

function countingPlans<T extends HostTool>(tool: T, runtime: AdminRuntime): T {
  return {
    ...tool,
    run: async (input: unknown, ctx: HostToolContext) => {
      runtime.plansRunning += 1;
      try {
        return await tool.run(input, ctx);
      } finally {
        runtime.plansRunning -= 1;
      }
    },
  };
}

function useAdminTools(admin: AdminOptions | null, runtime: AdminRuntime, requestConfirmation: ConfirmRequest): Record<string, HostTool> {
  const enabled = admin !== null;
  const mode = discoverSettingsOf(admin).mode;
  const optionsRef = useRef(admin);
  optionsRef.current = admin;
  return useMemo(() => {
    if (!enabled) return NO_TOOLS;
    const confirm = (steps: Step[]) => {
      const sentences = describeSteps(steps);
      return requestConfirmation(ADMIN_TOOLS.run, { steps }, sentences.join("\n"), sentences);
    };
    const options = () => optionsRef.current ?? DEFAULT_ADMIN;
    const discover = async (request: DiscoverRequest): Promise<DiscoverOutcome> => {
      if (isFresh(runtime, discoverSettingsOf(options()).ttlMs)) return freshOutcome(runtime);
      return discoverThroughFrame(runtime, options(), request);
    };
    const tools = createAdminTools({
      root: () => document.body,
      page: () => currentPage(),
      resolver: runtime.resolver,
      cache: runtime.cache,
      confirm,
      options,
      discover: mode === "off" ? undefined : discover,
    }) as Record<string, HostTool>;
    tools[ADMIN_TOOLS.run] = countingPlans(tools[ADMIN_TOOLS.run], runtime);
    return tools;
  }, [enabled, mode, runtime, requestConfirmation]);
}

const NO_ROUTES: RouteEntry[] = [];
const NO_OBSERVED: string[] = [];

const DISABLED_ADMIN: VexaAdminValue = {
  enabled: false,
  discover: () => Promise.resolve(IDLE_DISCOVERY),
  progress: IDLE_DISCOVERY,
  blocked: null,
  routes: NO_ROUTES,
  observed: NO_OBSERVED,
  exportPages: () => exportPages(createObservationCache()),
  importPages: () => ({ ok: false, error: "admin is not enabled on this VexaProvider" }),
  canSave: false,
  save: () => Promise.resolve({ ok: false, error: "admin is not enabled on this VexaProvider" }),
  clear: () => undefined,
};

function useCacheVersion(cache: ObservationCache): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((current) => current + 1);
    const unsubscribe = cache.subscribe(bump);
    bump();
    return unsubscribe;
  }, [cache]);
  return version;
}

function useVexaAdminValue(api: string, admin: AdminOptions | null, runtime: AdminRuntime): VexaAdminValue {
  const enabled = admin !== null;
  const canSave = usePagesFileSync(api, admin, runtime);
  const optionsRef = useRef(admin);
  optionsRef.current = admin;
  const [progress, setProgress] = useState<DiscoveryProgress>(IDLE_DISCOVERY);
  useAutoDiscovery(admin, runtime, setProgress);
  const version = useCacheVersion(runtime.cache);
  const discover = useCallback(
    async (options?: DiscoverOptions) => {
      const outcome = await discoverThroughFrame(runtime, optionsRef.current ?? DEFAULT_ADMIN, {
        limit: options?.limit,
        skip: options?.skip,
        onProgress: (update) => {
          setProgress(update);
          options?.onProgress?.(update);
        },
      });
      if (outcome.ok) return outcome.progress;
      const failed: DiscoveryProgress = { status: "failed", visited: runtime.cache.observed(), pending: 0, errors: [{ path: currentPage().path, error: "DISCOVERY_UNAVAILABLE" }] };
      setProgress(failed);
      return failed;
    },
    [runtime],
  );
  const clear = useCallback(() => {
    runtime.cache.clear();
    runtime.discoveredAt = null;
    setProgress(IDLE_DISCOVERY);
  }, [runtime]);
  return useMemo<VexaAdminValue>(() => {
    if (!enabled) return DISABLED_ADMIN;
    return {
      enabled,
      discover,
      progress,
      blocked: runtime.blocked,
      routes: runtime.cache.routes(),
      observed: runtime.cache.observed(),
      exportPages: () => exportPages(runtime.cache),
      importPages: (data) => importPages(runtime.cache, data),
      canSave,
      save: () => savePagesFile(api, exportPages(runtime.cache)),
      clear,
    };
  }, [api, enabled, discover, progress, runtime, clear, version, canSave]);
}

function useMergedTools(hostTools: Record<string, HostTool>, adminTools: Record<string, HostTool>): Record<string, HostTool> {
  return useMemo(() => {
    if (adminTools === NO_TOOLS) return hostTools;
    return { ...hostTools, ...adminTools };
  }, [hostTools, adminTools]);
}

export function VexaProvider<S extends ContextSchema>({
  api = "/api/chat",
  chat = NO_CHAT_DEFAULTS,
  format,
  functions = NO_FUNCTIONS,
  theme,
  tools: hostTools = NO_TOOLS,
  admin,
  context,
  contextSchema,
  onToolResult,
  children,
}: VexaProviderProps<S>) {
  if (context && !contextSchema) {
    throw new Error("VexaProvider: contextSchema is required when context is provided");
  }
  assertToolNames(hostTools);
  const adminOptions = adminOptionsOf(admin, useInDiscoveryFrame());

  const [pending, setPending] = useState<PendingConfirmation[]>([]);
  const [chatMounted, setChatMounted] = useState(false);
  const themeElement = useRef<HTMLDivElement>(null);
  const resolvers = useRef(new Map<string, (approved: boolean) => void>());
  const chatSender = useRef<((text: string) => void) | null>(null);
  const toolsRef = useRef(hostTools);

  const formatter = useMemo(() => createFormatter(format), [format]);

  const readContext = useCallback(async (): Promise<Record<string, unknown>> => {
    if (!context || !contextSchema) return {};
    const result = await validateWith(contextSchema as ContextSchema, context());
    if (result.ok) return result.value;
    console.warn("VexaProvider: context failed contextSchema validation", result.error);
    return {};
  }, [context, contextSchema]);

  const requestConfirmation = useCallback<ConfirmRequest>((name, input, description, steps) => {
    const id = crypto.randomUUID();
    return new Promise<boolean>((resolve) => {
      resolvers.current.set(id, resolve);
      setPending((current) => [...current, steps ? { id, name, input, description, steps } : { id, name, input, description }]);
    });
  }, []);

  const adminRuntime = useAdminRuntime(adminOptions);
  const adminTools = useAdminTools(adminOptions, adminRuntime, requestConfirmation);
  const adminValue = useVexaAdminValue(api, adminOptions, adminRuntime);
  const tools = useMergedTools(hostTools, adminTools);
  toolsRef.current = tools;

  const [schemas, setSchemas] = useState<HostToolDescriptor[]>([]);
  useEffect(() => {
    let active = true;
    void toolSchemas(tools).then((next) => {
      if (active) setSchemas(next);
    });
    return () => {
      active = false;
    };
  }, [tools]);

  const resolveConfirmation = useCallback((id: string, approved: boolean) => {
    resolvers.current.get(id)?.(approved);
    resolvers.current.delete(id);
    setPending((current) => current.filter((item) => item.id !== id));
  }, []);

  const runTool = useCallback(
    async (name: string, input: unknown, ctx: HostToolContext): Promise<HostToolResult> => {
      const tool = toolsRef.current[name];
      if (!tool) return { ok: false, error: `Unknown host tool "${name}"` };
      const parsed = await parseInput(tool, input);
      if (!parsed.ok) return parsed;
      if (tool.confirm) {
        const approved = await requestConfirmation(name, parsed.value, tool.description);
        if (!approved) return { ok: false, error: "The user declined to run this tool" };
      }
      let result: HostToolResult;
      try {
        result = await tool.run(parsed.value, ctx);
      } catch (error) {
        result = { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
      onToolResult?.(name, result);
      return result;
    },
    [onToolResult, requestConfirmation],
  );

  const value = useMemo<VexaHostValue>(
    () => ({
      api,
      admin: adminValue,
      chat,
      formatter,
      functions,
      tools,
      schemas,
      readContext,
      runTool,
      hasTool: (name) => name in toolsRef.current,
      pending,
      resolveConfirmation,
      sendToChat: (text) => {
        if (!chatSender.current) return false;
        chatSender.current(text);
        return true;
      },
      registerChatSender: (send) => {
        chatSender.current = send;
        setChatMounted(send !== null);
      },
    }),
    [api, adminValue, chat, formatter, functions, tools, schemas, readContext, runTool, pending, resolveConfirmation],
  );

  const mode = theme?.mode ?? "light";
  return (
    <VexaHostContext.Provider value={value}>
      <PortalContainerContext.Provider value={themeElement}>
        <div
          ref={themeElement}
          data-vexa-theme=""
          data-vexa-mode={mode}
          data-vexa-glow={theme?.glow === false ? "off" : undefined}
          className={mode === "dark" ? "dark" : undefined}
          style={{ display: "contents", ...themeStyle(theme) }}
        >
          {children}
          {!chatMounted && pending.length > 0 ? (
            <ConfirmationTray labels={{ ...DEFAULT_LABELS, ...chat.labels }} pending={pending} onDecide={resolveConfirmation} />
          ) : null}
        </div>
      </PortalContainerContext.Provider>
    </VexaHostContext.Provider>
  );
}

function ConfirmationTray({
  pending,
  labels,
  onDecide,
}: {
  pending: PendingConfirmation[];
  labels: ChatLabels;
  onDecide: (id: string, approved: boolean) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(100vw-2rem,22rem)] flex-col gap-2" data-vexa-ignore="">
      {pending.map((item) => (
        <div
          key={item.id}
          role="alertdialog"
          aria-label={labels.runOnPage(item.name)}
          className="rounded-xl border border-border bg-card p-3 text-sm text-foreground shadow-[0_18px_40px_-16px_var(--vexa-glow)]"
        >
          <ConfirmationSummary item={item} labels={labels} />
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onDecide(item.id, false)}
              className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={() => onDecide(item.id, true)}
              className="inline-flex h-8 items-center rounded-lg bg-gradient-to-r from-primary to-brand-violet px-3 text-xs font-medium text-primary-foreground"
            >
              {labels.run}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConfirmationSummary({ item, labels }: { item: PendingConfirmation; labels: ChatLabels }) {
  if (!item.steps) {
    return (
      <>
        <p className="font-medium">{labels.runOnPage(item.name)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
      </>
    );
  }
  return (
    <>
      <p className="font-medium">{labels.runSteps(item.steps.length)}</p>
      <ol className="mt-1 flex list-decimal flex-col gap-0.5 pl-4 text-xs text-muted-foreground">
        {item.steps.map((step, index) => (
          <li key={index} className="wrap-anywhere">
            {step}
          </li>
        ))}
      </ol>
    </>
  );
}

export function useVexaHostContext(): VexaHostValue | null {
  return useContext(VexaHostContext);
}

const defaultFormatter = createFormatter(DEFAULT_FORMAT);

export function useVexaFormat(): Formatter {
  return useContext(VexaHostContext)?.formatter ?? defaultFormatter;
}

export function useVexaHost() {
  const host = useVexaHostContext();
  return {
    runTool: (name: string, input: unknown) =>
      host
        ? host.runTool(name, input, { toolCallId: null, source: "button" })
        : Promise.resolve<HostToolResult>({ ok: false, error: "No VexaProvider above this component" }),
    sendToChat: (text: string) => host?.sendToChat(text) ?? false,
    tools: host?.schemas ?? [],
  };
}

/** Page discovery and the observation cache behind `admin`: `discover()` walks the app's links read-only; `routes` and `observed` are what the model can see. */
export function useVexaAdmin(): VexaAdminValue {
  return useVexaHostContext()?.admin ?? DISABLED_ADMIN;
}
