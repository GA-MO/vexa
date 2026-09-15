import { DOCS_BASE_URL } from "./source";

/** Old docs slug → current slug ("" is the docs home); also inlined into 404.html for static hosts. */
export const MOVED_DOCS_PAGES: Record<string, string> = {
  concepts: "",
  "concepts/catalog": "catalog#how-the-catalog-works",
  "concepts/host-tools": "host/host-tools",
  "concepts/security-model": "security",
  "concepts/spec-stream": "spec-stream",
  "concepts/state": "state",
};

const ANCHOR = /#.*$/;

/** The current URL of a docs page that moved, or undefined when the slugs never pointed at a moved page. */
export function movedDocsUrl(slugs: string[]) {
  const target = MOVED_DOCS_PAGES[slugs.join("/")];
  if (target === undefined) return undefined;
  return target.length > 0 ? `${DOCS_BASE_URL}/${target}` : DOCS_BASE_URL;
}

/** The `.md` twin of a moved page, without the anchor a Markdown response cannot use. */
export function movedDocsMarkdownUrl(slugs: string[]) {
  const url = movedDocsUrl(slugs);
  if (url === undefined || url === DOCS_BASE_URL) return url;
  return `${url.replace(ANCHOR, "")}.md`;
}
