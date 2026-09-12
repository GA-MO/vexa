import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createDocsMcpServer,
  type DocsBackend,
  type DocsComponentEntry,
  type DocsSearchResult,
} from "../app/lib/docs-mcp";

const DEFAULT_DOCS_URL = "http://localhost:3002";
const TRAILING_SLASHES = /\/+$/;

const docsUrl = (process.env.VEXA_DOCS_URL ?? DEFAULT_DOCS_URL).replace(TRAILING_SLASHES, "");

async function fetchJson<T>(path: string) {
  const response = await fetch(`${docsUrl}${path}`);
  if (!response.ok) throw new Error(`${path} responded ${response.status}`);
  return (await response.json()) as T;
}

const httpDocsBackend: DocsBackend = {
  async search(query, limit) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const body = await fetchJson<{ results: DocsSearchResult[] }>(`/api/docs/search?${params}`);
    return body.results;
  },
  async getPage(slug) {
    const response = await fetch(`${docsUrl}/docs/${slug}.md`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`/docs/${slug}.md responded ${response.status}`);
    return response.text();
  },
  async listComponents() {
    const body = await fetchJson<{ components: DocsComponentEntry[] }>("/api/docs/components");
    return body.components;
  },
};

const server = createDocsMcpServer(httpDocsBackend);
await server.connect(new StdioServerTransport());
