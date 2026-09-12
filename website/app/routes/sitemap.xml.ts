import { docsPageGroups, docsSectionPaths } from "@/lib/llms";
import { absoluteUrl } from "@/lib/site";
import { DOCS_BASE_URL } from "@/lib/source";

const TOP_LEVEL_PATHS = ["/", "/playground", "/changelog", DOCS_BASE_URL];
const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8" };
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

function urlEntry(path: string) {
  return `  <url>\n    <loc>${absoluteUrl(path)}</loc>\n  </url>`;
}

function htmlPaths() {
  const docsPaths = docsPageGroups().flatMap((group) => group.pages.map((page) => page.path));
  return [...new Set([...TOP_LEVEL_PATHS, ...docsSectionPaths(), ...docsPaths])];
}

function renderSitemap() {
  const entries = htmlPaths().map(urlEntry).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${entries}\n</urlset>\n`;
}

export function loader() {
  return new Response(renderSitemap(), { headers: XML_HEADERS });
}
