export { streamAgentChat, type StreamAgentChatOptions, type HostToolSchema, type GuardConfig, type SecurityNotice } from "../core/chat";
export { createVexaHandler, inferProvider, type VexaHandlerConfig, type ChatBody, type ModelRegistry, type ModelEntry, type ModelInfo, type ModelResolver } from "../core/handler";
export { connectMcp, prefixedToolName, type McpServerConfig, type McpTransportConfig, type ToolTier } from "../core/mcp";
export { fence, fenceAsData, flagInjection, scanValue, DEFAULT_GUARD_RULES, type GuardRule, type GuardFinding } from "../core/guard";
export type { Persona, PersonaContext, PromptToolInfo, ToolTier as PromptToolTier } from "../core/prompt";
