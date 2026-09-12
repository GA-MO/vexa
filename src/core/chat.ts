import { pipeJsonRender } from "@json-render/core";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  type LanguageModel,
  type PrepareStepFunction,
  type StepResult,
  type StopCondition,
  type Tool,
  type ToolSet,
  type UIMessage,
} from "ai";
import { buildAgentInstructions, type Persona, type PromptToolInfo, type ToolTier } from "./prompt";
import { downgradeNotice, fence, fenceAsData, scanValue, type GuardFinding, type GuardRule } from "./guard";
import { connectMcp, type McpServerConfig } from "./mcp";

export type HostToolSchema = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type GuardConfig = {
  onFlagged?: "downgrade" | "off";
  rules?: GuardRule[];
};

export type SecurityNotice = {
  kind: "injection";
  tool: string;
  rules: string[];
  excerpt: string;
};

export type StreamAgentChatOptions = {
  model: LanguageModel;
  providerOptions?: Record<string, Record<string, unknown>>;
  context?: Record<string, unknown>;
  hostTools?: HostToolSchema[];
  tools?: ToolSet;
  toolTiers?: Record<string, ToolTier>;
  mcp?: McpServerConfig[];
  instructions?: string[];
  persona?: Persona;
  rules?: string[];
  stopWhen?: StopCondition<ToolSet>;
  toolApprovalSecret?: string;
  guard?: GuardConfig;
  req?: Request;
};

function hostToolSet(schemas: HostToolSchema[]): ToolSet {
  const tools: ToolSet = {};
  for (const schema of schemas) {
    tools[schema.name] = tool({
      description: fenceAsData(schema.description),
      inputSchema: jsonSchema(schema.inputSchema as never),
    });
  }
  return tools;
}

function fencedForModel(definition: Tool): Tool {
  const description = typeof definition.description === "string" ? fence(definition.description) : definition.description;
  if (definition.toModelOutput) return { ...(definition as Record<string, unknown>), description } as unknown as Tool;
  return {
    ...(definition as Record<string, unknown>),
    description,
    toModelOutput: ({ output }: { output: unknown }) => ({
      type: "text" as const,
      value: fenceAsData(typeof output === "string" ? output : JSON.stringify(output ?? null)),
    }),
  } as unknown as Tool;
}

function fenceToolSet(tools: ToolSet): ToolSet {
  return Object.fromEntries(Object.entries(tools).map(([name, definition]) => [name, fencedForModel(definition)]));
}

function tierOf(name: string, definition: Tool, explicit: Record<string, ToolTier>, hostToolNames: Set<string>): ToolTier {
  if (hostToolNames.has(name)) return "read";
  if (explicit[name]) return explicit[name];
  return definition.needsApproval ? "write" : "read";
}

function groupByTier(tools: ToolSet, tiers: Record<string, ToolTier>): PromptToolInfo {
  const info: PromptToolInfo = { read: [], write: [], destructive: [] };
  for (const name of Object.keys(tools)) info[tiers[name] ?? "read"].push(name);
  return info;
}

function firstFlaggedResult(steps: Array<StepResult<ToolSet>>, rules?: GuardRule[]) {
  for (const step of steps) {
    for (const result of [...step.toolResults, ...step.dynamicToolResults]) {
      const finding = scanValue(result.output, rules);
      if (finding) return { toolName: result.toolName, finding };
    }
  }
  return null;
}

type GuardState = { flagged: { toolName: string; finding: GuardFinding } | null };

function guardStep(
  readOnly: string[],
  system: string,
  guard: GuardConfig | undefined,
  state: GuardState,
): PrepareStepFunction<ToolSet> | undefined {
  if (guard?.onFlagged === "off") return undefined;
  return ({ steps }) => {
    const flagged = firstFlaggedResult(steps, guard?.rules);
    if (!flagged) return {};
    state.flagged = flagged;
    return {
      activeTools: readOnly,
      system: `${system}\n${downgradeNotice(flagged.finding, flagged.toolName)}`,
    };
  };
}

export async function streamAgentChat(
  messages: UIMessage[],
  options: StreamAgentChatOptions,
) {
  const mcp = options.mcp && options.mcp.length > 0 ? await connectMcp(options.mcp) : null;
  const hostTools = hostToolSet(options.hostTools ?? []);
  const hostToolNames = new Set(Object.keys(hostTools));
  const tools: ToolSet = {
    ...fenceToolSet(options.tools ?? {}),
    ...fenceToolSet(mcp?.tools ?? {}),
    ...hostTools,
  };
  const explicitTiers = { ...(options.toolTiers ?? {}), ...(mcp?.tiers ?? {}) };
  const tiers = Object.fromEntries(
    Object.entries(tools).map(([name, definition]) => [name, tierOf(name, definition, explicitTiers, hostToolNames)]),
  ) as Record<string, ToolTier>;
  const readOnly = Object.keys(tools).filter((name) => tiers[name] === "read");

  const system = buildAgentInstructions({
    persona: options.persona,
    rules: options.rules,
    instructions: options.instructions,
    tools: groupByTier(tools, tiers),
    context: options.context,
    req: options.req,
  });
  const modelMessages = await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true });
  const guardState: GuardState = { flagged: null };

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      let noticeSent = false;
      const result = streamText({
        model: options.model,
        system,
        messages: modelMessages,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        stopWhen: options.stopWhen ?? stepCountIs(4),
        prepareStep: guardStep(readOnly, system, options.guard, guardState),
        experimental_context: { context: options.context ?? {} },
        experimental_toolApprovalSecret: options.toolApprovalSecret,
        onStepFinish: () => {
          if (noticeSent || !guardState.flagged) return;
          noticeSent = true;
          const notice: SecurityNotice = {
            kind: "injection",
            tool: guardState.flagged.toolName,
            rules: guardState.flagged.finding.rules,
            excerpt: guardState.flagged.finding.excerpt,
          };
          writer.write({ type: "data-notice", data: notice });
        },
        onFinish: async () => {
          await mcp?.close();
        },
        ...(options.providerOptions ? { providerOptions: options.providerOptions as never } : {}),
      });
      writer.merge(pipeJsonRender(result.toUIMessageStream({ sendReasoning: true })));
    },
  });

  return createUIMessageStreamResponse({ stream });
}
