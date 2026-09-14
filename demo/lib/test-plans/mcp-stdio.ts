import type { Scenario } from "@/lib/scenarios/types";

export const scenario: Scenario = {
  id: "mcp-stdio",
  requiresEnv: "VEXA_DEMO_MCP",
  title: "Local stdio MCP server with an allow list",
  controlPath: "stdio MCP (fixtures) → allow list → prefixed tool name; write needs approval",
  page: "/",
  script: [
    {
      user: "Read fixtures/notes.txt and summarize it.",
      expectTools: ["fixtures__read_file"],
      expectText: /barista|Saturday/i,
    },
    {
      user: 'Now update fixtures/hours.txt to add a line saying "Closed on Mondays."',
      expectTools: ["fixtures__read_file", "fixtures__write_file"],
    },
    { reject: "fixtures__write_file", expectNoTools: true },
  ],
  bestPractice:
    "An MCP server's tools are namespaced by server name (fixtures__read_file, not read_file) and tiered like any other tool; write its description as \"call it directly, the user approves before it runs\" or the model asks for permission in chat instead of ever calling the write tool.",
};
