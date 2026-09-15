import type { Scenario } from "@/lib/scenarios/types";
import { toolOutputText } from "@/lib/scenarios/mock-output";

const NOTES_PATH = "fixtures/notes.txt";
const HOURS_PATH = "fixtures/hours.txt";
const NEW_HOURS_LINE = "Closed on Mondays.";

export const scenario: Scenario = {
  id: "mcp-stdio",
  requiresEnv: "VEXA_DEMO_MCP",
  title: "Local stdio MCP server with an allow list",
  controlPath: "stdio MCP (fixtures) → allow list → prefixed tool name; write needs approval",
  page: "/",
  docs: "server/mcp",
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
  mock: [
    {
      match: /read fixtures\/notes\.txt/i,
      steps: [
        { reasoning: "The fixtures MCP server exposes read_file under its own prefix; I read the file before summarizing." },
        {
          tool: "fixtures__read_file",
          input: { path: NOTES_PATH },
          then: (output) => [{ text: `Summary of ${NOTES_PATH}: ${toolOutputText(output)}` }],
        },
      ],
    },
    {
      match: /update fixtures\/hours\.txt/i,
      steps: [
        { reasoning: "A write must keep the existing content, so I read hours.txt first, then call write_file directly; the user approves it before it runs." },
        {
          tool: "fixtures__read_file",
          input: { path: HOURS_PATH },
          then: (output) => [
            {
              tool: "fixtures__write_file",
              input: { path: HOURS_PATH, content: `${toolOutputText(output).trimEnd()}\n${NEW_HOURS_LINE}\n` },
              then: [{ text: `${HOURS_PATH} now ends with "${NEW_HOURS_LINE}".` }],
              onError: [{ text: `${HOURS_PATH} was not changed: the write was declined.` }],
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "An MCP server's tools are namespaced by server name (fixtures__read_file, not read_file) and tiered like any other tool; write its description as \"call it directly, the user approves before it runs\" or the model asks for permission in chat instead of ever calling the write tool.",
};
