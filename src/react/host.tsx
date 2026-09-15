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
import { createFormatter, DEFAULT_FORMAT, type Formatter, type VexaFormat } from "./format";
import { themeStyle, type VexaTheme } from "./theme";

export type HostToolResult =
  | { ok: true; summary?: string; data?: unknown }
  | { ok: false; error: string };

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

export type VexaHostValue = {
  api: string;
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

export function VexaProvider<S extends ContextSchema>({
  api = "/api/chat",
  chat = NO_CHAT_DEFAULTS,
  format,
  functions = NO_FUNCTIONS,
  theme,
  tools = NO_TOOLS,
  context,
  contextSchema,
  onToolResult,
  children,
}: VexaProviderProps<S>) {
  if (context && !contextSchema) {
    throw new Error("VexaProvider: contextSchema is required when context is provided");
  }
  assertToolNames(tools);

  const [pending, setPending] = useState<PendingConfirmation[]>([]);
  const [chatMounted, setChatMounted] = useState(false);
  const themeElement = useRef<HTMLDivElement>(null);
  const resolvers = useRef(new Map<string, (approved: boolean) => void>());
  const chatSender = useRef<((text: string) => void) | null>(null);
  const toolsRef = useRef(tools);
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
  const formatter = useMemo(() => createFormatter(format), [format]);

  const readContext = useCallback(async (): Promise<Record<string, unknown>> => {
    if (!context || !contextSchema) return {};
    const result = await validateWith(contextSchema as ContextSchema, context());
    if (result.ok) return result.value;
    console.warn("VexaProvider: context failed contextSchema validation", result.error);
    return {};
  }, [context, contextSchema]);

  const requestConfirmation = useCallback((name: string, input: unknown, description: string) => {
    const id = crypto.randomUUID();
    return new Promise<boolean>((resolve) => {
      resolvers.current.set(id, resolve);
      setPending((current) => [...current, { id, name, input, description }]);
    });
  }, []);

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
    [api, chat, formatter, functions, tools, schemas, readContext, runTool, pending, resolveConfirmation],
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
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
      {pending.map((item) => (
        <div
          key={item.id}
          role="alertdialog"
          aria-label={labels.runOnPage(item.name)}
          className="rounded-xl border border-border bg-card p-3 text-sm text-foreground shadow-[0_18px_40px_-16px_var(--vexa-glow)]"
        >
          <p className="font-medium">{labels.runOnPage(item.name)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
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
