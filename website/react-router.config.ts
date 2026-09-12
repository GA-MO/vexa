import type { Config } from "@react-router/dev/config";
import { createGetUrl, getSlugs } from "fumadocs-core/source";
import { glob } from "node:fs/promises";
import { DOCS_SECTIONS } from "./app/lib/docs-sections";

const DOCS_BASE_URL = "/docs";
const DOCS_CONTENT_DIR = "content/docs";
const SERVER_ONLY_PATHS = ["/api/health", "/api/chat", "/api/assistant", "/api/docs/search", "/api/docs/pages", "/api/docs/components", "/mcp"];
const AGENT_SURFACE_PATHS = ["/llms.txt", "/llms-full.txt", "/sitemap.xml", "/robots.txt"];

const getDocsUrl = createGetUrl(DOCS_BASE_URL);

function markdownUrlFor(slugs: string[]) {
  if (slugs.length === 0) return undefined;
  return `${getDocsUrl(slugs)}.md`;
}

async function collectDocsPaths() {
  const paths = new Set<string>([DOCS_BASE_URL]);
  for (const section of DOCS_SECTIONS) paths.add(`${DOCS_BASE_URL}/${section.slug}`);
  for await (const entry of glob("**/*.mdx", { cwd: DOCS_CONTENT_DIR })) {
    const slugs = getSlugs(entry);
    paths.add(getDocsUrl(slugs));
    const markdownUrl = markdownUrlFor(slugs);
    if (markdownUrl) paths.add(markdownUrl);
  }
  return paths;
}

export default {
  ssr: true,
  async prerender({ getStaticPaths }) {
    const staticPaths = getStaticPaths().filter((path) => !SERVER_ONLY_PATHS.includes(path));
    return [...new Set([...staticPaths, ...AGENT_SURFACE_PATHS, ...(await collectDocsPaths())])];
  },
} satisfies Config;
