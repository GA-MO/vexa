import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { stepCountIs, tool } from "ai";
import { createVexaHandler, DEFAULT_GUARD_RULES } from "vexa/server";
import { z } from "zod";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

export const { GET, POST, PUT } = createVexaHandler({
  // Model registry: ids the client picker may request; GET /api/chat publishes this list.
  models: {
    "google/gemini-2.5-flash": { model: () => openrouter("google/gemini-2.5-flash"), name: "Gemini 2.5 Flash", maxTokens: 1_000_000 },
    "anthropic/claude-sonnet-4": { model: () => openrouter("anthropic/claude-sonnet-4"), name: "Claude Sonnet 4", maxTokens: 200_000 },
  },
  // Alternative to `models`: one model, or a resolver that picks one per request (tenant, header, body.model).
  // model: (body, req) => req.headers.get("x-tenant") === "acme" ? acmeModel : undefined,
  // Passed through to streamText for every request; keys are provider ids.
  providerOptions: { openrouter: { reasoning: { effort: "medium" } } },
  // Who the assistant is: a string, a list of paragraphs, or a function of { today, context, tools, req }. First layer of the prompt.
  persona: ({ today, context }) => [
    "You are the assistant built into Acme admin.",
    `Today is ${today}. The user is on ${String(context.path ?? "/")}.`,
  ],
  // Domain rules appended after the catalog rules: when to call which tool, what counts as a fact.
  rules: ["Never state a number from memory: every fact comes from a tool result in this conversation."],
  // Free-form operator notes placed after the rules and before the fenced page context.
  instructions: ["Answer in the language of the user's last message."],
  // Server tools (AI SDK `tool()`); outputs are fenced as data before the model reads them.
  tools: {
    get_order: tool({
      description: "Read one order by id.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => ({ id, status: "paid" }),
    }),
    refund_order: tool({
      description: "Refund one order in full; irreversible, so the user must approve it.",
      inputSchema: z.object({ id: z.string(), reason: z.string() }),
      // needsApproval makes the chat show an approval card; the tier defaults to "write".
      needsApproval: true,
      execute: async ({ id }) => ({ id, refunded: true }),
    }),
  },
  // Override the inferred tier per tool: "read" never gates, "write" and "destructive" ask, and a flagged turn keeps only "read".
  toolTiers: { refund_order: "destructive" },
  // MCP servers: every tool must be allow-listed; names arrive prefixed as `<name>__<tool>`; an unspecified tier is "destructive".
  mcp: [
    {
      name: "fixtures",
      transport: { type: "stdio", command: "bun", args: ["scripts/fixture-mcp.ts"] },
      allow: ["read_file", "write_file"],
      tierOf: (toolName) => (toolName === "write_file" ? "write" : "read"),
    },
    {
      name: "docs",
      transport: { type: "http", url: "https://docs.example.com/mcp", headers: { Authorization: `Bearer ${process.env.DOCS_MCP_TOKEN}` } },
      allow: ["search_docs"],
      tier: "read",
    },
  ],
  // Bounds the tool loop per request; keep it small, every step costs a model call.
  stopWhen: stepCountIs(6),
  // Accepts the provider's admin_observe / admin_run / admin_discover schemas, adds the "Driving the page" rules and makes admin_run write tier; off by default, and the client cannot turn it on alone. Pages are discovered in the browser; `admin: { pagesFile }` is the optional repo-file path instead.
  admin: true,
  // Signs approvals so a client cannot forge or replay one; set it from the environment.
  toolApprovalSecret: process.env.VEXA_APPROVAL_SECRET,
  // Injection guard over tool results: "downgrade" (default) limits the turn to read tools and shows a notice; add rules instead of turning it off.
  guard: {
    onFlagged: "downgrade",
    rules: [...DEFAULT_GUARD_RULES, { id: "acme-reset", label: "Reset phrase", pattern: /acme reset code/i }],
  },
});
