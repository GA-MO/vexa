import type { Node as PageTreeNode } from "fumadocs-core/page-tree";
import { DOCS_DOORS, DOCS_SECTIONS } from "./docs-sections";
import { docsPageSummary, type DocsPageSummary } from "./markdown";
import { DOCS_BASE_URL, source } from "./source";

const UNORDERED = Number.MAX_SAFE_INTEGER;

const SECTIONS_BY_SLUG = new Map(
  [...DOCS_DOORS, ...DOCS_SECTIONS].map((section) => [section.slug, section]),
);

/** Opening description of the library, reused by llms.txt and llms-full.txt. */
export const SITE_SUMMARY = [
  "Vexa is a React 19 library that embeds a chat overlay into any app. The assistant answers with text and with generative UI: it streams JSON specs that render as React components from a fixed catalog, so it can only produce interfaces the host already approved.",
  "The host owns the capabilities. `VexaProvider` registers host tools that run in the browser and page context, and `createVexaHandler` runs the server side on the AI SDK with the host's own model registry, server tools and MCP servers.",
].join("\n\n");

export interface DocsPageGroup {
  title: string;
  description: string;
  pages: DocsPageSummary[];
}

function pageOrderFromTree() {
  const order = new Map<string, number>();

  const remember = (url: string) => {
    if (!order.has(url)) order.set(url, order.size);
  };

  const walk = (nodes: PageTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === "page") remember(node.url);
      if (node.type !== "folder") continue;
      if (node.index) remember(node.index.url);
      walk(node.children);
    }
  };

  walk(source.getPageTree().children);
  return order;
}

function createGroup(slug: string): DocsPageGroup {
  const section = SECTIONS_BY_SLUG.get(slug);
  return { title: section?.title ?? slug, description: section?.description ?? "", pages: [] };
}

export function docsPageGroups(): DocsPageGroup[] {
  const order = pageOrderFromTree();
  const pages = [...source.getPages()].sort(
    (left, right) => (order.get(left.url) ?? UNORDERED) - (order.get(right.url) ?? UNORDERED),
  );
  const groups = new Map<string, DocsPageGroup>();

  for (const page of pages) {
    const summary = docsPageSummary(page);
    const slug = summary.slugs[0] ?? "docs";
    const group = groups.get(slug) ?? createGroup(slug);
    group.pages.push(summary);
    groups.set(slug, group);
  }

  return [...groups.values()];
}

/** Section landing pages: they are routes with a placeholder body, not MDX files. */
export function docsSectionPaths() {
  return DOCS_SECTIONS.map((section) => `${DOCS_BASE_URL}/${section.slug}`);
}

export async function docsPageRaw(summary: DocsPageSummary) {
  const page = source.getPage(summary.slugs);
  if (!page) throw new Response(`Unknown docs page: ${summary.path}`, { status: 404 });
  return page.data.getText("raw");
}
