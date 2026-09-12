"use client";

import { asSchema } from "ai";
import type { HostTool, HostToolResult } from "./host";

type WebMcpToolResponse = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

type WebMcpToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; title?: string };
  execute: (input: unknown) => Promise<WebMcpToolResponse>;
};

type WebMcpModelContext = {
  registerTool: (tool: WebMcpToolDefinition) => void;
  unregisterTool: (name: string) => void;
};

function modelContext(): WebMcpModelContext | null {
  if (typeof navigator === "undefined") return null;
  const candidate = (navigator as Navigator & { modelContext?: WebMcpModelContext }).modelContext;
  return candidate && typeof candidate.registerTool === "function" ? candidate : null;
}

function toResponse(result: HostToolResult): WebMcpToolResponse {
  if (!result.ok) return { content: [{ type: "text", text: result.error }], isError: true };
  const text = result.summary ?? JSON.stringify(result.data ?? { ok: true });
  return { content: [{ type: "text", text }] };
}

/** Registers read-only host tools (confirm !== true) with the browser's WebMCP model context. Returns an unregister function. */
export function registerWebMcp(tools: Record<string, HostTool>): () => void {
  const ctx = modelContext();
  if (!ctx) return () => {};
  const registered: string[] = [];
  for (const [name, tool] of Object.entries(tools)) {
    if (tool.confirm) continue;
    const schema = tool.input ? asSchema(tool.input) : null;
    void Promise.resolve(schema?.jsonSchema ?? { type: "object", properties: {} }).then((inputSchema) => {
      try {
        ctx.registerTool({
          name,
          description: tool.description,
          inputSchema: inputSchema as Record<string, unknown>,
          annotations: { readOnlyHint: true, title: name },
          execute: async (input) => {
            const validated = schema?.validate ? await schema.validate(input ?? {}) : { success: true as const, value: input ?? {} };
            if (!validated.success) return { content: [{ type: "text", text: "Invalid input" }], isError: true };
            return toResponse(await tool.run(validated.value as never, { toolCallId: null, source: "model" }));
          },
        });
        registered.push(name);
      } catch (error) {
        console.warn(`Vexa: failed to register WebMCP tool "${name}"`, error);
      }
    });
  }
  return () => {
    for (const name of registered) ctx.unregisterTool(name);
  };
}
