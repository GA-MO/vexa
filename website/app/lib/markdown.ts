import { readFileSync } from "node:fs";
import path from "node:path";
import { frontmatter } from "fumadocs-core/content/md/frontmatter";
import { exampleAppUrl, resolveExampleUrl, type ExampleApp } from "./example-urls";
import { absoluteUrl } from "./site";
import type { source } from "./source";

const CODE_FENCE = /^\s*(?:`{3,}|~{3,})/;
const GENERATED_MARKER = /^\s*\{\/\*\s*generated:(?:start|end)\s*\*\/\}\s*$/;
const MDX_ESM_STATEMENT = /^(?:import|export)\s/;
const EXAMPLE_TAG = /^\s*<Example\s+id="([^"]+)"\s*\/>\s*$/;
const CATALOG_GALLERY_TAG = /^\s*<CatalogGallery\s*\/>\s*$/;
const EXAMPLE_APP_LINK_TAG = /^\s*<ExampleAppLink\s+app="([^"]+)"(?:\s+path="([^"]*)")?\s+label="([^"]+)"(?:\s+note="[^"]*")?\s*\/>\s*$/;
const INCLUDE_TAG = /^\s*<include(?:\s+meta='title="([^"]*)"')?>([^<]+)<\/include>\s*$/;
const DOCS_CONTENT_DIR = path.join(process.cwd(), "content/docs");
const REPEATED_BLANK_LINES = /\n{3,}/g;
const LIVE_EXAMPLE_ANCHOR = "#live-example";
const LOCAL_EXAMPLE_LINK = /\(http:\/\/localhost:300[13][^)]*\)/g;

type DocsPage = ReturnType<typeof source.getPages>[number];

export interface DocsPageSummary {
  title: string;
  description: string;
  slugs: string[];
  path: string;
  markdownPath: string;
  file: string;
}

function liveExampleNote(exampleId: string, htmlUrl: string) {
  return `_Live example \`${exampleId}\` is rendered on the HTML page: ${htmlUrl}${LIVE_EXAMPLE_ANCHOR}. Its spec is the \`${exampleId}\` example in \`vexa/examples\`._`;
}

function liveGalleryNote(htmlUrl: string) {
  return `_The live gallery of every example is rendered on the HTML page: ${htmlUrl}#live-gallery. The specs are \`GALLERY_SECTIONS\` in \`vexa/examples\`._`;
}

function includedCodeFence(includeDir: string, relativePath: string, title: string | undefined) {
  const file = path.join(includeDir, relativePath);
  const lang = path.extname(file).slice(1);
  const meta = title ? ` title="${title}"` : "";
  return `\`\`\`${lang}${meta}\n${readFileSync(file, "utf8").trimEnd()}\n\`\`\``;
}

function transformContentLine(line: string, htmlUrl: string, includeDir: string) {
  if (GENERATED_MARKER.test(line)) return undefined;
  if (MDX_ESM_STATEMENT.test(line)) return undefined;
  const example = EXAMPLE_TAG.exec(line);
  if (example) return liveExampleNote(example[1], htmlUrl);
  if (CATALOG_GALLERY_TAG.test(line)) return liveGalleryNote(htmlUrl);
  const include = INCLUDE_TAG.exec(line);
  if (include) return includedCodeFence(includeDir, include[2], include[1]);
  const appLink = EXAMPLE_APP_LINK_TAG.exec(line);
  if (appLink) return `**[${appLink[3]}](${exampleAppUrl(appLink[1] as ExampleApp, appLink[2] ?? "/")})**`;
  return line.replace(LOCAL_EXAMPLE_LINK, (link) => `(${resolveExampleUrl(link.slice(1, -1))})`);
}

/** Turns an MDX body into plain Markdown: no generated markers, no ESM, no JSX tag an agent cannot render; `<include>` files become code fences. */
export function mdxBodyToMarkdown(body: string, htmlUrl: string, includeDir = DOCS_CONTENT_DIR) {
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
    const transformed = transformContentLine(line, htmlUrl, includeDir);
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
    file: page.path,
  };
}

/** The Markdown served at `<page>.md` and embedded in llms-full.txt. */
export function docsPageMarkdown(summary: DocsPageSummary, raw: string) {
  const htmlUrl = absoluteUrl(summary.path);
  const { content } = frontmatter(raw);
  const description = summary.description ? `${summary.description}\n\n` : "";

  const includeDir = path.join(DOCS_CONTENT_DIR, path.dirname(summary.file));
  return `# ${summary.title}\n\nSource: ${htmlUrl}\n\n${description}${mdxBodyToMarkdown(content, htmlUrl, includeDir)}\n`;
}
