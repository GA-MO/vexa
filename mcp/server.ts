import { createMcpApp } from "@json-render/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { catalog } from "vexa/core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadHtml() {
  const htmlPath = path.join(__dirname, "dist", "index.html");
  if (!fs.existsSync(htmlPath)) {
    throw new Error(
      `Built HTML not found at ${htmlPath}. Run bun run mcp:build first.`,
    );
  }
  return fs.readFileSync(htmlPath, "utf-8");
}

async function createServer() {
  return createMcpApp({
    name: "Vexa",
    version: "0.1.0",
    catalog,
    html: loadHtml(),
    tool: {
      name: "render_ui",
      title: "Render Vexa",
      description:
        "Render an interactive UI from a json-render spec constrained to the Vexa catalog. Use when the user asks for dashboards, cards, metrics, tables, comparisons, or any visual layout.",
    },
  });
}

async function startStdio() {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}

async function startHttp() {
  const port = Number(process.env.MCP_PORT ?? "3101");
  const expressApp = createMcpExpressApp({ host: "0.0.0.0" });

  expressApp.all("/mcp", async (req, res) => {
    const server = await createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      void transport.close().catch(() => {});
      void server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  expressApp.listen(port, () => {
    console.log(`MCP server listening on http://localhost:${port}/mcp`);
  });
}

if (process.argv.includes("--stdio")) {
  startStdio().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  startHttp().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
