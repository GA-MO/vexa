import { docsPageGroups, SITE_SUMMARY, type DocsPageGroup } from "@/lib/llms";
import type { DocsPageSummary } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/site";

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" };

function pageLine(page: DocsPageSummary) {
  const link = `- [${page.title}](${absoluteUrl(page.markdownPath)})`;
  return page.description ? `${link}: ${page.description}` : link;
}

function groupBlock(group: DocsPageGroup) {
  const heading = group.description ? `## ${group.title}\n\n${group.description}` : `## ${group.title}`;
  return `${heading}\n\n${group.pages.map(pageLine).join("\n")}`;
}

function renderLlmsIndex() {
  const intro = [
    "# Vexa",
    "",
    SITE_SUMMARY,
    "",
    `Every page below links to its Markdown source. The HTML version drops the \`.md\` suffix. The whole documentation as one file: ${absoluteUrl("/llms-full.txt")}`,
  ].join("\n");

  return `${[intro, ...docsPageGroups().map(groupBlock)].join("\n\n")}\n`;
}

export function loader() {
  return new Response(renderLlmsIndex(), { headers: TEXT_HEADERS });
}
