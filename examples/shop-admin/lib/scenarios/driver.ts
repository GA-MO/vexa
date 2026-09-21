import {
  applySpecPatch,
  createStateStore,
  executeAction,
  resolveAction,
  resolveActionParam,
  resolveRepeatItemStatePath,
  resolveRepeatStatePath,
  runValidation,
  type ActionBinding,
  type JsonPatch,
  type PropResolutionContext,
  type ResolvedAction,
  type StateStore,
  type ValidationConfig,
} from "@json-render/core";
import { isDeepEqualData, isToolUIPart, getToolName, type UIMessage } from "ai";
import {
  createFormatter,
  createGuardedStore,
  createVexaHandlers,
  type HostToolContext,
  type HostToolDescriptor,
  type HostToolResult,
  type VexaHostValue,
} from "vexa/react";
import { IDLE_DISCOVERY } from "vexa/admin";
import type { Spec, SpecPatch } from "vexa/protocol";
import type { HeadlessTool, HeadlessToolFn, ScenarioFixture, StateDiff } from "./types";

export type HeadlessHostOptions = {
  tools?: Record<string, HeadlessTool>;
  hostTools?: HostToolDescriptor[];
  context?: Record<string, unknown>;
};

export type HostConfirmRequest = { toolCallId: string; name: string; input: unknown };

export type HeadlessHost = Pick<VexaHostValue, "hasTool" | "runTool" | "sendToChat" | "schemas" | "readContext"> & {
  sentToChat: string[];
  toolCalls: Array<{ name: string; input: unknown; source: HostToolContext["source"] }>;
  pendingConfirm: HostConfirmRequest[];
  needsConfirm: (name: string) => boolean;
  requestConfirm: (request: HostConfirmRequest) => void;
  confirmTool: (name: string, approved: boolean) => Promise<{ toolCallId: string; output: HostToolResult } | null>;
};

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
}

function runOf(tool: HeadlessTool): HeadlessToolFn {
  return typeof tool === "function" ? tool : tool.run;
}

/** Mirrors VexaProvider's confirm gate: a `confirm: true` host tool pauses for an approve/reject step instead of running immediately. */
export function createHeadlessHost({ tools = {}, hostTools = [], context = {} }: HeadlessHostOptions): HeadlessHost {
  const host: HeadlessHost = {
    sentToChat: [],
    toolCalls: [],
    pendingConfirm: [],
    schemas: hostTools,
    readContext: async () => context,
    hasTool: (name) => name in tools || hostTools.some((tool) => tool.name === name),
    needsConfirm: (name) => {
      const tool = tools[name];
      return typeof tool === "object" && tool.confirm === true;
    },
    requestConfirm: (request) => {
      host.pendingConfirm.push(request);
    },
    runTool: async (name, input, ctx) => {
      host.toolCalls.push({ name, input, source: ctx.source });
      const tool = tools[name];
      if (!tool) return { ok: false, error: `Tool "${name}" has no headless implementation in this scenario` };
      return runOf(tool)(asRecord(input));
    },
    confirmTool: async (name, approved) => {
      const index = host.pendingConfirm.findIndex((request) => request.name === name);
      if (index === -1) return null;
      const [request] = host.pendingConfirm.splice(index, 1);
      const output: HostToolResult = approved
        ? await host.runTool(name, request.input, { toolCallId: request.toolCallId, source: "model" })
        : { ok: false, error: "The user declined to run this tool" };
      return { toolCallId: request.toolCallId, output };
    },
    sendToChat: (text) => {
      host.sentToChat.push(text);
      return true;
    },
  };
  return host;
}

const NO_ADMIN: VexaHostValue["admin"] = {
  enabled: false,
  discover: () => Promise.resolve(IDLE_DISCOVERY),
  progress: IDLE_DISCOVERY,
  blocked: null,
  routes: [],
  observed: [],
  exportPages: () => ({ version: 1, pages: [], links: [] }),
  importPages: () => ({ ok: false, error: "no admin in the headless host" }),
  canSave: false,
  save: () => Promise.resolve({ ok: false, error: "no admin in the headless host" }),
  clear: () => undefined,
};

function toHostValue(host: HeadlessHost): VexaHostValue {
  return {
    api: "/api/chat",
    admin: NO_ADMIN,
    chat: {},
    formatter: createFormatter(),
    functions: {},
    tools: {},
    schemas: host.schemas,
    readContext: host.readContext,
    runTool: host.runTool,
    hasTool: host.hasTool,
    pending: [],
    resolveConfirmation: () => undefined,
    sendToChat: host.sendToChat,
    registerChatSender: () => undefined,
  };
}

function isHostToolResult(value: unknown): value is HostToolResult {
  return typeof value === "object" && value !== null && typeof (value as { ok?: unknown }).ok === "boolean";
}

function storedToolValue(output: unknown) {
  if (!isHostToolResult(output)) return output;
  if (!output.ok) return output;
  return output.data ?? { ok: true, summary: output.summary };
}

function fixtureState(fixture: ScenarioFixture): Record<string, unknown> {
  const specState = fixture.spec.state ?? {};
  return { ...specState, ...(fixture.state ?? {}) };
}

function bindingsOf(fixture: ScenarioFixture, id: string, event: string): ActionBinding[] {
  const element = fixture.spec.elements[id];
  if (!element) throw new Error(`Fixture has no element "${id}"`);
  const bound = element.on?.[event];
  if (!bound) throw new Error(`Element "${id}" has no on.${event}`);
  return Array.isArray(bound) ? bound : [bound];
}

function watchBindingsFor(fixture: ScenarioFixture, path: string): ActionBinding[] {
  const bindings: ActionBinding[] = [];
  for (const element of Object.values(fixture.spec.elements)) {
    const bound = element.watch?.[path];
    if (!bound) continue;
    bindings.push(...(Array.isArray(bound) ? bound : [bound]));
  }
  return bindings;
}

function bindStatePath(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const bound = (value as { $bindState?: unknown }).$bindState;
  return typeof bound === "string" ? bound : null;
}

/** Mirrors ValidationProvider's field registration: any element with `checks` and a bound value/checked prop is a validatable field. */
function formFieldConfigs(fixture: ScenarioFixture): Array<{ path: string; config: ValidationConfig }> {
  const fields: Array<{ path: string; config: ValidationConfig }> = [];
  for (const element of Object.values(fixture.spec.elements)) {
    const props = (element.props ?? {}) as Record<string, unknown>;
    if (!Array.isArray(props.checks)) continue;
    const path = bindStatePath(props.value) ?? bindStatePath(props.checked);
    if (!path) continue;
    fields.push({ path, config: { checks: props.checks as ValidationConfig["checks"] } });
  }
  return fields;
}

type RepeatItemContext = { repeatItem: unknown; repeatIndex: number; repeatBasePath: string };

/** Resolves the repeated row a `press(id, item)` call targets, the way RepeatScopeProvider would for that row's index. */
function repeatItemContext(fixture: ScenarioFixture, store: StateStore, id: string, item: string): RepeatItemContext {
  const element = fixture.spec.elements[id];
  if (!element) throw new Error(`Fixture has no element "${id}"`);
  if (!element.repeat) throw new Error(`Element "${id}" has no repeat, cannot select item "${item}"`);
  const statePath = resolveRepeatStatePath(element.repeat.statePath);
  if (!statePath) throw new Error(`Element "${id}" repeat.statePath could not be resolved`);
  const rows = store.get(statePath);
  const list = Array.isArray(rows) ? rows : [];
  const key = element.repeat.key ?? "id";
  const index = list.findIndex((row) => row !== null && typeof row === "object" && (row as Record<string, unknown>)[key] === item);
  if (index === -1) throw new Error(`No item with ${key} = "${item}" in the repeat at "${statePath}"`);
  return { repeatItem: list[index], repeatIndex: index, repeatBasePath: resolveRepeatItemStatePath(statePath, index) };
}

type BuiltInActions = Record<string, (resolved: ResolvedAction) => void>;

/** validateForm has no headless equivalent to json-render's React ValidationProvider, so it is reproduced here from the fixture's own checks + bound paths. */
function builtInActions(guarded: StateStore, store: StateStore, fixture: ScenarioFixture): BuiltInActions {
  return {
    setState: ({ params }) => {
      const statePath = params.statePath;
      if (typeof statePath === "string") guarded.set(statePath, params.value);
    },
    pushState: ({ params }) => {
      const statePath = params.statePath;
      if (typeof statePath !== "string") return;
      const current = guarded.get(statePath);
      const list = Array.isArray(current) ? current : [];
      guarded.set(statePath, [...list, params.value]);
      if (typeof params.clearStatePath === "string") guarded.set(params.clearStatePath, "");
    },
    removeState: ({ params }) => {
      const statePath = params.statePath;
      if (typeof statePath !== "string" || typeof params.index !== "number") return;
      const current = guarded.get(statePath);
      const list = Array.isArray(current) ? current : [];
      guarded.set(statePath, list.filter((_, index) => index !== params.index));
    },
    validateForm: ({ params }) => {
      const statePath = typeof params.statePath === "string" && params.statePath.length > 0 ? params.statePath : "/formValidation";
      const stateModel = store.getSnapshot();
      const errors: Record<string, string[]> = {};
      let valid = true;
      for (const { path, config } of formFieldConfigs(fixture)) {
        const result = runValidation(config, { value: store.get(path), stateModel });
        if (!result.valid) {
          valid = false;
          errors[path] = result.errors;
        }
      }
      guarded.set(statePath, { valid, errors });
    },
  };
}

type SpecDataPartPayload = { type: "patch"; patch: SpecPatch } | { type: "flat"; spec: Spec } | { type: "nested"; spec: unknown };

function specDataPayload(part: UIMessage["parts"][number]): SpecDataPartPayload | null {
  if (part.type !== "data-spec") return null;
  const data = (part as { data?: unknown }).data;
  if (typeof data !== "object" || data === null || !("type" in data)) return null;
  return data as SpecDataPartPayload;
}

export type SpecDriver = {
  store: StateStore;
  host: HeadlessHost;
  press: (id: string, item?: string) => Promise<void>;
  type: (path: string, value: unknown) => Promise<void>;
  get: (path: string) => unknown;
  diffState: (expected: Record<string, unknown>) => StateDiff;
  recordToolOutputs: (messages: UIMessage[]) => void;
  drainSentToChat: () => string[];
  patch: (patches: SpecPatch[]) => void;
  hasElement: (id: string) => boolean;
  applySpecParts: (parts: UIMessage["parts"]) => void;
};

/** Drives a fixture spec the way SpecView does, without React: same store guard, same action handlers. */
export function createSpecDriver(fixture: ScenarioFixture, host: HeadlessHost): SpecDriver {
  const store = createStateStore(fixtureState(fixture));
  const guarded = createGuardedStore(store);
  const handlers = createVexaHandlers(store, toHostValue(host));
  const builtIns = builtInActions(guarded, store, fixture);

  const resolveParams = (params: Record<string, unknown> | undefined, itemCtx?: RepeatItemContext): Record<string, unknown> => {
    if (!params) return {};
    const ctx: PropResolutionContext = {
      stateModel: store.getSnapshot(),
      repeatItem: itemCtx?.repeatItem,
      repeatIndex: itemCtx?.repeatIndex,
      repeatBasePath: itemCtx?.repeatBasePath,
    };
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) resolved[key] = resolveActionParam(value, ctx);
    return resolved;
  };

  const execute = async (binding: ActionBinding, itemCtx?: RepeatItemContext): Promise<void> => {
    const resolved = resolveAction(binding, store.getSnapshot());
    resolved.params = resolveParams(binding.params, itemCtx);
    const builtIn = builtIns[resolved.action];
    if (builtIn) return builtIn(resolved);
    const handler = handlers[resolved.action as keyof typeof handlers];
    if (!handler) {
      console.warn(`No handler registered for action: ${resolved.action}`);
      return;
    }
    await executeAction({ action: resolved, handler, setState: guarded.set, executeAction: (next) => execute(next, itemCtx) });
  };

  return {
    store,
    host,
    press: async (id, item) => {
      const itemCtx = item !== undefined ? repeatItemContext(fixture, store, id, item) : undefined;
      for (const binding of bindingsOf(fixture, id, "press")) await execute(binding, itemCtx);
    },
    type: async (path, value) => {
      const changed = !isDeepEqualData(store.get(path), value);
      guarded.set(path, value);
      if (!changed) return;
      for (const binding of watchBindingsFor(fixture, path)) await execute(binding);
    },
    get: (path) => store.get(path),
    diffState: (expected) => {
      const diff: StateDiff = {};
      for (const [path, value] of Object.entries(expected)) {
        const actual = store.get(path);
        if (!isDeepEqualData(actual, value)) diff[path] = { expected: value, actual };
      }
      return diff;
    },
    recordToolOutputs: (messages) => {
      for (const message of messages) {
        for (const part of message.parts) {
          if (!isToolUIPart(part) || part.state !== "output-available") continue;
          store.set(`/tools/${getToolName(part)}`, storedToolValue(part.output));
        }
      }
    },
    drainSentToChat: () => host.sentToChat.splice(0, host.sentToChat.length),
    patch: (patches) => {
      for (const op of patches) applySpecPatch(fixture.spec, op as JsonPatch);
    },
    hasElement: (id) => id in fixture.spec.elements,
    applySpecParts: (parts) => {
      for (const part of parts) {
        const payload = specDataPayload(part);
        if (!payload) continue;
        if (payload.type === "patch") applySpecPatch(fixture.spec, payload.patch as JsonPatch);
        else if (payload.type === "flat") Object.assign(fixture.spec, payload.spec);
      }
    },
  };
}
