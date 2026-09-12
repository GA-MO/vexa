import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const DOCS_MCP_SERVER_NAME = "vexa-docs";
export const DOCS_MCP_SERVER_VERSION = "0.1.0";
export const DEFAULT_SEARCH_LIMIT = 8;
export const MAX_SEARCH_LIMIT = 20;

export interface DocsSearchResult {
  title: string;
  url: string;
  markdownUrl: string;
  section: string;
  excerpt: string;
}

export interface DocsPageEntry {
  title: string;
  description: string;
  url: string;
  markdownUrl: string;
  section: string;
}

export interface DocsComponentEntry {
  name: string;
  description: string;
  url: string;
  markdownUrl: string;
}

export interface DocsBackend {
  search(query: string, limit: number): Promise<DocsSearchResult[]>;
  getPage(slug: string): Promise<string | undefined>;
  listComponents(): Promise<DocsComponentEntry[]>;
}

const SEARCH_INPUT = {
  query: z.string().min(1).describe("Free-text query, for example 'host tool' or 'bar chart horizontal'"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_SEARCH_LIMIT)
    .optional()
    .describe(`Maximum number of pages to return (default ${DEFAULT_SEARCH_LIMIT})`),
};

const GET_PAGE_INPUT = {
  slug: z
    .string()
    .min(1)
    .describe("Docs slug such as 'host/host-tools', or any docs URL or path such as '/docs/host/host-tools.md'"),
};

const DOCS_PATH_PREFIX = /^\/?docs\//;
const MARKDOWN_SUFFIX = /\.md$/;
const URL_ANCHOR_OR_QUERY = /[#?].*$/;

/** Accepts a slug, a site path or an absolute docs URL and returns the bare slug, for example `host/host-tools`. */
export function normalizeDocsSlug(input: string) {
  let value = input.trim();
  if (/^https?:\/\//.test(value)) value = new URL(value).pathname;
  value = value.replace(URL_ANCHOR_OR_QUERY, "").replace(DOCS_PATH_PREFIX, "").replace(MARKDOWN_SUFFIX, "");
  return value.replace(/^\/+|\/+$/g, "");
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errorResult(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true };
}

function formatSearchResults(query: string, results: DocsSearchResult[]) {
  if (results.length === 0) return `No docs page matches "${query}".`;
  const lines = results.map(
    (result) =>
      `- ${result.title} (${result.section})\n  markdown: ${result.markdownUrl}\n  html: ${result.url}\n  ${result.excerpt}`,
  );
  return `${results.length} page(s) for "${query}". Call get_page with the markdown URL or slug to read one.\n\n${lines.join("\n")}`;
}

function formatComponents(components: DocsComponentEntry[]) {
  const lines = components.map((component) => `- ${component.name}: ${component.description} (${component.markdownUrl})`);
  return `${components.length} catalog components. Each line is name: description (markdown url).\n\n${lines.join("\n")}`;
}

/** Builds the `vexa-docs` MCP server; the backend decides whether pages come from memory or over HTTP. */
export function createDocsMcpServer(backend: DocsBackend) {
  const server = new McpServer({ name: DOCS_MCP_SERVER_NAME, version: DOCS_MCP_SERVER_VERSION });

  server.registerTool(
    "search_docs",
    {
      title: "Search Vexa docs",
      description:
        "Full-text search over the Vexa documentation. Returns matching pages with a short excerpt and the Markdown URL to pass to get_page.",
      inputSchema: SEARCH_INPUT,
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit }) => {
      const results = await backend.search(query, limit ?? DEFAULT_SEARCH_LIMIT);
      return textResult(formatSearchResults(query, results));
    },
  );

  server.registerTool(
    "get_page",
    {
      title: "Read a Vexa docs page",
      description: "Returns one documentation page as Markdown. Accepts a slug ('host/host-tools'), a path or a full URL.",
      inputSchema: GET_PAGE_INPUT,
      annotations: { readOnlyHint: true },
    },
    async ({ slug }) => {
      const normalized = normalizeDocsSlug(slug);
      const markdown = normalized ? await backend.getPage(normalized) : undefined;
      if (markdown === undefined) return errorResult(`No docs page for "${slug}". Use search_docs to find the slug.`);
      return textResult(markdown);
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List catalog components",
      description:
        "Lists every component the Vexa assistant can render, with a one-line description and the docs URL of its props table and example spec.",
      annotations: { readOnlyHint: true },
    },
    async () => textResult(formatComponents(await backend.listComponents())),
  );

  return server;
}
