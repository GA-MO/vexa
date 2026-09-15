import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import type { Tool, ToolSet } from "ai";
import { fence } from "./guard";

export type ToolTier = "read" | "write" | "destructive";

export type McpTransportConfig =
  | { type: "http"; url: string; headers?: Record<string, string> }
  | { type: "stdio"; command: string; args?: string[]; env?: Record<string, string> };

export type McpServerConfig = {
  name: string;
  transport: McpTransportConfig;
  allow: string[];
  tier?: ToolTier;
  tierOf?: (toolName: string) => ToolTier;
};

export type ConnectedMcp = {
  tools: ToolSet;
  tiers: Record<string, ToolTier>;
  close: () => Promise<void>;
};

const SERVER_NAME = /^[a-z][a-z0-9_]{0,31}$/;
const TOOL_NAME = /^[A-Za-z0-9_.-]{1,64}$/;

function assertConfig(config: McpServerConfig) {
  if (!SERVER_NAME.test(config.name)) {
    throw new Error(`MCP server name "${config.name}" must match ${SERVER_NAME}`);
  }
  if (!Array.isArray(config.allow) || config.allow.length === 0) {
    throw new Error(`MCP server "${config.name}" needs a non-empty allow list`);
  }
  if (config.allow.includes("*")) {
    throw new Error(`MCP server "${config.name}" allow list cannot contain "*"`);
  }
}

/** The stdio transport is loaded on demand: it needs child_process, and a handler that only uses http MCP or none must stay bundleable for the browser. */
async function transportFor(config: McpTransportConfig) {
  if (config.type === "http") {
    return { type: "http" as const, url: config.url, headers: config.headers };
  }
  const { Experimental_StdioMCPTransport: StdioMCPTransport } = await import("@ai-sdk/mcp/mcp-stdio");
  return new StdioMCPTransport({ command: config.command, args: config.args, env: config.env });
}

export function prefixedToolName(server: string, tool: string) {
  return `${server}__${tool.replace(/[^A-Za-z0-9_]/g, "_")}`;
}

function tierFor(config: McpServerConfig, toolName: string): ToolTier {
  return config.tierOf?.(toolName) ?? config.tier ?? "destructive";
}

function wrapTool(tool: Tool, tier: ToolTier): Tool {
  const description = typeof tool.description === "string" ? fence(tool.description) : tool.description;
  return {
    ...(tool as Record<string, unknown>),
    description,
    needsApproval: tier !== "read",
  } as unknown as Tool;
}

async function connectOne(config: McpServerConfig): Promise<{ client: MCPClient; tools: ToolSet; tiers: Record<string, ToolTier> }> {
  assertConfig(config);
  const client = await createMCPClient({ transport: await transportFor(config.transport), clientName: "vexa" });
  const available = await client.tools();
  const tools: ToolSet = {};
  const tiers: Record<string, ToolTier> = {};
  for (const name of config.allow) {
    if (!TOOL_NAME.test(name)) continue;
    const tool = available[name] as Tool | undefined;
    if (!tool) {
      console.warn(`MCP server "${config.name}" did not expose allowed tool "${name}"`);
      continue;
    }
    const tier = tierFor(config, name);
    const fullName = prefixedToolName(config.name, name);
    tools[fullName] = wrapTool(tool, tier);
    tiers[fullName] = tier;
  }
  return { client, tools, tiers };
}

export async function connectMcp(configs: McpServerConfig[]): Promise<ConnectedMcp> {
  const connections = await Promise.all(configs.map(connectOne));
  const tools: ToolSet = {};
  const tiers: Record<string, ToolTier> = {};
  for (const connection of connections) {
    Object.assign(tools, connection.tools);
    Object.assign(tiers, connection.tiers);
  }
  return {
    tools,
    tiers,
    close: async () => {
      await Promise.all(connections.map((connection) => connection.client.close().catch(() => undefined)));
    },
  };
}
