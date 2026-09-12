import { frontmatter } from "fumadocs-core/content/md/frontmatter";
import { absoluteUrl } from "./site";
import type { source } from "./source";

const CODE_FENCE = /^\s*(?:`{3,}|~{3,})/;
const GENERATED_MARKER = /^\s*\{\/\*\s*generated:(?:start|end)\s*\*\/\}\s*$/;
const MDX_ESM_STATEMENT = /^(?:import|export)\s/;
const EXAMPLE_TAG = /^\s*<Example\s+id="([^"]+)"\s*\/>\s*$/;
const CATALOG_GALLERY_TAG = /^\s*<CatalogGallery\s*\/>\s*$/;
const REPEATED_BLANK_LINES = /\n{3,}/g;
const LIVE_EXAMPLE_ANCHOR = "#live-example";

type DocsPage = ReturnType<typeof source.getPages>[number];

export interface DocsPageSummary {
  title: string;
  description: string;
  slugs: string[];
  path: string;
  markdownPath: string;
}

function liveExampleNote(exampleId: string, htmlUrl: string) {
  return `_Live example \`${exampleId}\` is rendered on the HTML page: ${htmlUrl}${LIVE_EXAMPLE_ANCHOR}. Its spec is the \`${exampleId}\` example in \`vexa/examples\`._`;
}

function liveGalleryNote(htmlUrl: string) {
  return `_The live gallery of every example is rendered on the HTML page: ${htmlUrl}#live-gallery. The specs are \`GALLERY_SECTIONS\` in \`vexa/examples\`._`;
}

function transformContentLine(line: string, htmlUrl: string) {
  if (GENERATED_MARKER.test(line)) return undefined;
  if (MDX_ESM_STATEMENT.test(line)) return undefined;
  const example = EXAMPLE_TAG.exec(line);
  if (example) return liveExampleNote(example[1], htmlUrl);
  if (CATALOG_GALLERY_TAG.test(line)) return liveGalleryNote(htmlUrl);
  return line;
}

/** Turns an MDX body into plain Markdown: no generated markers, no ESM, no JSX tag an agent cannot render. */
export function mdxBodyToMarkdown(body: string, htmlUrl: string) {
  const output: string[] = [];
  let insideCodeFence = false;

  for (const line of body.split("\n")) {
    if (CODE_FENCE.test(line)) {
      insideCodeFence = !insideCodeFence;
      output.push(line);
      continue;
    }
    if (insideCodeFence) {
      output.push(line);
      continue;
    }
    const transformed = transformContentLine(line, htmlUrl);
    if (transformed !== undefined) output.push(transformed);
  }

  return output.join("\n").replace(REPEATED_BLANK_LINES, "\n\n").trim();
}

export function docsPageSummary(page: DocsPage): DocsPageSummary {
  return {
    title: page.data.title ?? page.slugs.at(-1) ?? "Docs",
    description: page.data.description ?? "",
    slugs: [...page.slugs],
    path: page.url,
    markdownPath: `${page.url}.md`,
  };
}

/** The Markdown served at `<page>.md` and embedded in llms-full.txt. */
export function docsPageMarkdown(summary: DocsPageSummary, raw: string) {
  const htmlUrl = absoluteUrl(summary.path);
  const { content } = frontmatter(raw);
  const description = summary.description ? `${summary.description}\n\n` : "";

  return `# ${summary.title}\n\nSource: ${htmlUrl}\n\n${description}${mdxBodyToMarkdown(content, htmlUrl)}\n`;
}
