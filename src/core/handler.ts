import type { LanguageModel, StopCondition, ToolSet, UIMessage } from "ai";
import { z } from "zod";
import { streamAgentChat, type GuardConfig, type HostToolSchema } from "./chat";
import type { Persona, ToolTier } from "./prompt";
import type { Catalog } from "./catalog";
import { prefixedToolName } from "./mcp";
import type { McpServerConfig } from "./mcp";
import { isAdminToolName } from "../admin/names";
import { createPagesReader, handlePagesWrite, nodePagesFs, pagesFileWritable, type PagesSource } from "./pages-file";

const hostToolSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  description: z.string().max(300),
  inputSchema: z.record(z.string(), z.unknown()),
});

const chatBody = z
  .object({
    id: z.string().optional(),
    trigger: z.string().optional(),
    messageId: z.string().optional(),
    messages: z.array(z.custom<UIMessage>((value) => typeof value === "object" && value !== null)).min(1).max(200),
    model: z.string().optional(),
    context: z.record(z.string(), z.unknown()).refine((value) => JSON.stringify(value).length <= 4_000, "context must serialize to 4 KB or less").optional(),
    hostTools: z.array(hostToolSchema).max(32).optional(),
  })
  .strict();

export type ChatBody = z.infer<typeof chatBody>;

export type ModelEntry =
  | LanguageModel
  | {
      model: LanguageModel | (() => LanguageModel);
      name?: string;
      provider?: string;
      maxTokens?: number;
    };

export type ModelRegistry = Record<string, ModelEntry>;

export type ModelInfo = { id: string; name: string; provider: string; maxTokens: number };

export type ModelResolver = (body: ChatBody, req: Request) => LanguageModel | undefined | Promise<LanguageModel | undefined>;

export type VexaHandlerConfig<T extends ToolSet = ToolSet> = {
  model?: LanguageModel | ModelResolver;
  catalog?: Catalog;
  models?: ModelRegistry | (() => ModelRegistry);
  providerOptions?: Record<string, Record<string, unknown>>;
  instructions?: string[];
  persona?: Persona;
  rules?: string[];
  tools?: T;
  toolTiers?: Partial<Record<keyof T & string, ToolTier>>;
  mcp?: McpServerConfig[];
  stopWhen?: StopCondition<ToolSet>;
  toolApprovalSecret?: string;
  guard?: GuardConfig;
  admin?: boolean | AdminHandlerOptions;
};

/** `pagesFile`: the pages file GET serves and the dev server writes (relative to the process cwd; never written in production). `pages`: the same data from elsewhere (a fetch, an import) for hosts with no filesystem. */
export type AdminHandlerOptions = { pagesFile?: string; pages?: PagesSource };

export function adminEnabled(admin: VexaHandlerConfig["admin"]): boolean {
  return Boolean(admin);
}

function adminOptionsOf(admin: VexaHandlerConfig["admin"]): AdminHandlerOptions {
  return typeof admin === "object" ? admin : {};
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function assertModelSource(config: VexaHandlerConfig) {
  if (config.model !== undefined || config.models !== undefined) return;
  throw new Error("createVexaHandler needs `model` or a `models` registry. Vexa does not create provider clients itself.");
}

const PROVIDER_HINTS: Array<[RegExp, string]> = [
  [/claude|anthropic/i, "anthropic"],
  [/gpt|o[134]-|openai/i, "openai"],
  [/gemini|google/i, "google"],
  [/llama|meta/i, "meta"],
  [/mistral|mixtral/i, "mistral"],
  [/deepseek/i, "deepseek"],
  [/grok|xai/i, "xai"],
];

export function inferProvider(id: string) {
  return PROVIDER_HINTS.find(([pattern]) => pattern.test(id))?.[1] ?? "openrouter";
}

function isLanguageModel(entry: ModelEntry): entry is LanguageModel {
  return typeof entry === "string" || !("model" in entry);
}

function memoizedRegistry(source: VexaHandlerConfig["models"]): () => ModelRegistry {
  let cached: ModelRegistry | null = null;
  return () => {
    if (cached) return cached;
    cached = typeof source === "function" ? source() : (source ?? {});
    if (Object.keys(cached).length === 0 && source !== undefined) {
      throw new Error("createVexaHandler: the `models` registry is empty");
    }
    return cached;
  };
}

function entryModel(entry: ModelEntry): LanguageModel {
  if (isLanguageModel(entry)) return entry;
  return typeof entry.model === "function" ? entry.model() : entry.model;
}

function modelInfo(id: string, entry: ModelEntry): ModelInfo {
  const meta: { name?: string; provider?: string; maxTokens?: number } = isLanguageModel(entry) ? {} : entry;
  return {
    id,
    name: meta.name ?? id,
    provider: meta.provider ?? inferProvider(id),
    maxTokens: meta.maxTokens ?? 128_000,
  };
}

async function resolveModel(
  config: VexaHandlerConfig,
  registry: () => ModelRegistry,
  body: ChatBody,
  req: Request,
): Promise<{ ok: true; model: LanguageModel } | { ok: false; error: string }> {
  if (typeof config.model === "function") {
    const forced = await (config.model as ModelResolver)(body, req);
    return forced ? { ok: true, model: forced } : { ok: false, error: "No model available for this request" };
  }
  if (config.model !== undefined) return { ok: true, model: config.model };
  const entries = registry();
  const ids = Object.keys(entries);
  const requested = body.model?.trim() || ids[0];
  const entry = requested ? entries[requested] : undefined;
  if (!entry) return { ok: false, error: `Model "${requested}" is not allowed by this endpoint` };
  return { ok: true, model: entryModel(entry) };
}

const ACTION_PREFIX = "⟦action⟧";
const ACTION_SHAPE = /^⟦action⟧\s+runTool\s+([A-Za-z0-9_]+)\s+(\{[\s\S]*\})\s*$/;

function knownToolNames(config: VexaHandlerConfig, body: ChatBody) {
  const names = new Set<string>(Object.keys(config.tools ?? {}));
  for (const hostTool of body.hostTools ?? []) names.add(hostTool.name);
  for (const server of config.mcp ?? []) for (const tool of server.allow) names.add(prefixedToolName(server.name, tool));
  return names;
}

/** Removes admin_* host tool schemas from a request unless the handler opted into page driving; only the server decides what the model may drive. */
export function dropAdminHostTools(body: ChatBody, admin: boolean | undefined): ChatBody {
  if (admin || !body.hostTools) return body;
  return { ...body, hostTools: body.hostTools.filter((hostTool) => !isAdminToolName(hostTool.name)) };
}

function textOf(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function unavailableActionText(name: string) {
  return `(The user pressed a button wired to a tool named "${name}", but no such tool is available. Tell the user that this action is unavailable. Do not call any tool for it.)`;
}

/** Rewrites a button-originated ⟦action⟧ message whose tool is unknown or malformed, so the model cannot be steered into calling arbitrary names. */
function sanitizeActionMessages(config: VexaHandlerConfig, body: ChatBody): UIMessage[] {
  const known = knownToolNames(config, body);
  return body.messages.map((message) => {
    if (message.role !== "user") return message;
    const text = textOf(message);
    if (!text.startsWith(ACTION_PREFIX)) return message;
    const match = ACTION_SHAPE.exec(text);
    const name = match?.[1] ?? "";
    let parsable = false;
    try {
      parsable = Boolean(match) && typeof JSON.parse(match![2]) === "object";
    } catch {
      parsable = false;
    }
    if (match && parsable && known.has(name)) return message;
    return { ...message, parts: [{ type: "text", text: unavailableActionText(name || "unknown") }] } as UIMessage;
  });
}

export function createVexaHandler<T extends ToolSet>(config: VexaHandlerConfig<T>) {
  assertModelSource(config);
  const registry = memoizedRegistry(config.models);

  const { pagesFile, pages: pagesSource } = adminOptionsOf(config.admin);
  const admin = adminEnabled(config.admin);
  const readPages = createPagesReader(pagesFile, pagesSource, nodePagesFs);

  const adminInfo = async () => {
    if (!admin) return {};
    const pages = await readPages();
    return {
      ...(pagesFileWritable(pagesFile) ? { pagesFile: { enabled: true } } : {}),
      ...(pages ? { pages } : {}),
    };
  };

  const GET = async () => {
    const info = await adminInfo();
    if (config.models === undefined) return Response.json({ models: [], default: null, ...info });
    const entries = registry();
    const models = Object.entries(entries).map(([id, entry]) => modelInfo(id, entry));
    return Response.json({ models, default: models[0]?.id ?? null, ...info });
  };

  const PUT = async (req: Request) => {
    if (!pagesFileWritable(pagesFile)) return errorResponse("Not found", 404);
    const fs = await nodePagesFs();
    if (!fs) return errorResponse("Not found", 404);
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return errorResponse("Request body must be JSON", 400);
    }
    return handlePagesWrite(pagesFile, raw, fs);
  };

  const POST = async (req: Request) => {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return errorResponse("Request body must be JSON", 400);
    }
    const parsed = chatBody.safeParse(raw);
    if (!parsed.success) {
      const detail = parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
      return errorResponse(`Invalid chat request: ${detail}`, 400);
    }
    const body = dropAdminHostTools(parsed.data, admin);
    const model = await resolveModel(config, registry, body, req);
    if (!model.ok) return errorResponse(model.error, 400);
    try {
      return await streamAgentChat(sanitizeActionMessages(config, body), {
        model: model.model,
        catalog: config.catalog,
        req,
        providerOptions: config.providerOptions,
        context: body.context,
        hostTools: body.hostTools as HostToolSchema[] | undefined,
        tools: config.tools,
        toolTiers: config.toolTiers as Record<string, ToolTier> | undefined,
        mcp: config.mcp,
        instructions: config.instructions,
        persona: config.persona,
        rules: config.rules,
        stopWhen: config.stopWhen,
        toolApprovalSecret: config.toolApprovalSecret,
        guard: config.guard,
        admin,
      });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed to stream chat", 500);
    }
  };
  return { GET, POST, PUT };
}
