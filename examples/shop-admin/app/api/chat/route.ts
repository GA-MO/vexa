import path from "node:path";
import type { McpServerConfig } from "vexa/server";
import { demoModels } from "@/lib/models";
import { createShopChatHandler } from "@/lib/shop/chat-handler";

export const maxDuration = 60;

const FIXTURE_MCP_SCRIPT = path.join(process.cwd(), "scripts/fixture-mcp.ts");

const fixturesMcp: McpServerConfig[] | undefined =
  process.env.VEXA_DEMO_MCP === "1"
    ? [
        {
          name: "fixtures",
          transport: { type: "stdio", command: "bun", args: [FIXTURE_MCP_SCRIPT] },
          allow: ["read_file", "write_file"],
          tierOf: (toolName) => (toolName === "write_file" ? "write" : "read"),
        },
      ]
    : undefined;

export const { GET, POST } = createShopChatHandler({ models: demoModels, mcp: fixturesMcp });
