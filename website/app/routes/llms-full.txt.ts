import { docsPageGroups, docsPageRaw, SITE_SUMMARY } from "@/lib/llms";
import { docsPageMarkdown, type DocsPageSummary } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/site";

const MAX_PAGE_CHARACTERS = 12_000;
const PAGE_SEPARATOR = "\n\n---\n\n";
const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" };

function capPageMarkdown(markdown: string, markdownUrl: string) {
  if (markdown.length <= MAX_PAGE_CHARACTERS) return markdown;
  const clipped = markdown.slice(0, MAX_PAGE_CHARACTERS);
  const lastLineBreak = clipped.lastIndexOf("\n");
  const kept = lastLineBreak > 0 ? clipped.slice(0, lastLineBreak) : clipped;
  return `${kept}\n\n_Truncated at ${MAX_PAGE_CHARACTERS} characters. Read the whole page at ${markdownUrl}._\n`;
}

async function pageBlock(summary: DocsPageSummary) {
  const markdown = docsPageMarkdown(summary, await docsPageRaw(summary));
  return capPageMarkdown(markdown, absoluteUrl(summary.markdownPath)).trim();
}

async function renderLlmsFull() {
  const summaries = docsPageGroups().flatMap((group) => group.pages);
  const blocks = await Promise.all(summaries.map(pageBlock));
  const intro = [
    "# Vexa — full documentation",
    "",
    SITE_SUMMARY,
    "",
    `Index with one line per page: ${absoluteUrl("/llms.txt")}. Each page below is also served on its own at its \`Source\` URL with a \`.md\` suffix. Pages longer than ${MAX_PAGE_CHARACTERS} characters are truncated and say so.`,
  ].join("\n");

  return `${[intro, ...blocks].join(PAGE_SEPARATOR)}\n`;
}

export async function loader() {
  return new Response(await renderLlmsFull(), { headers: TEXT_HEADERS });
}
