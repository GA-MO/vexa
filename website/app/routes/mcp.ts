import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { inProcessDocsBackend } from "@/lib/docs-api";
import { createDocsMcpServer } from "@/lib/docs-mcp";
import type { Route } from "./+types/mcp";

async function handleMcpRequest(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  const server = createDocsMcpServer(inProcessDocsBackend);
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}

export function loader({ request }: Route.LoaderArgs) {
  return handleMcpRequest(request);
}

export function action({ request }: Route.ActionArgs) {
  return handleMcpRequest(request);
}
