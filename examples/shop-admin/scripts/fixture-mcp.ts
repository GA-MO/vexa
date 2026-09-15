import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const FIXTURES_DIR = fileURLToPath(new URL("../fixtures", import.meta.url));

function fixturePath(relativePath: string) {
  const withoutFixturesPrefix = relativePath.replace(/^\.?\/?fixtures\//, "");
  const resolved = path.resolve(FIXTURES_DIR, withoutFixturesPrefix);
  if (!resolved.startsWith(FIXTURES_DIR)) throw new Error(`"${relativePath}" escapes the fixtures directory`);
  return resolved;
}

const server = new McpServer({ name: "vexa-fixture-mcp", version: "1.0.0" });

server.registerTool(
  "read_file",
  {
    description: "Read a text file inside the demo fixtures directory.",
    inputSchema: { path: z.string().min(1) },
  },
  async ({ path: relativePath }) => {
    const text = await readFile(fixturePath(relativePath), "utf8");
    return { content: [{ type: "text", text }] };
  },
);

server.registerTool(
  "write_file",
  {
    description:
      "Overwrite a text file inside the demo fixtures directory with the full new content. Call it directly as soon as you have the content to write; the user is asked to approve it before it actually runs, so do not ask for permission in chat first.",
    inputSchema: { path: z.string().min(1), content: z.string() },
  },
  async ({ path: relativePath, content }) => {
    await writeFile(fixturePath(relativePath), content, "utf8");
    return { content: [{ type: "text", text: `Wrote ${relativePath}` }] };
  },
);

await server.connect(new StdioServerTransport());
