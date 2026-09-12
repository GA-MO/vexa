import { createFromSource } from "fumadocs-core/search/server";
import { DOCS_DOORS, DOCS_SECTIONS } from "./docs-sections";
import { docsPageGroups, docsPageRaw } from "./llms";
import { docsPageMarkdown, docsPageSummary, type DocsPageSummary } from "./markdown";
import {
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT,
  type DocsBackend,
  type DocsComponentEntry,
  type DocsPageEntry,
  type DocsSearchResult,
} from "./docs-mcp";
import { absoluteUrl } from "./site";
import { source } from "./source";

const CATALOG_SLUG = "catalog";
const URL_ANCHOR = /#.*$/;
const HIGHLIGHT_TAGS = /<\/?mark>/g;
const WHITESPACE = /\s+/g;
const MAX_EXCERPT_CHARACTERS = 200;

const SECTION_TITLES = new Map([...DOCS_DOORS, ...DOCS_SECTIONS].map((section) => [section.slug, section.title]));

const searchServer = createFromSource(source);

function sectionTitleFor(summary: DocsPageSummary) {
  const [first] = summary.slugs;
  if (summary.slugs.length < 2 || !first) return "Docs";
  return SECTION_TITLES.get(first) ?? first;
}

function plainExcerpt(content: string) {
  const text = content.replace(HIGHLIGHT_TAGS, "").replace(WHITESPACE, " ").trim();
  if (text.length <= MAX_EXCERPT_CHARACTERS) return text;
  return `${text.slice(0, MAX_EXCERPT_CHARACTERS).trimEnd()}…`;
}

function pageEntry(summary: DocsPageSummary): DocsPageEntry {
  return {
    title: summary.title,
    description: summary.description,
    url: absoluteUrl(summary.path),
    markdownUrl: absoluteUrl(summary.markdownPath),
    section: sectionTitleFor(summary),
  };
}

export function clampSearchLimit(raw: string | null) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed)) return DEFAULT_SEARCH_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_SEARCH_LIMIT);
}

type SearchHit = Awaited<ReturnType<typeof searchServer.search>>[number];

function excerptFor(hits: SearchHit[], description: string) {
  const preferred = hits.find((hit) => hit.type === "text") ?? hits.find((hit) => hit.type === "heading");
  return preferred ? plainExcerpt(preferred.content) : description;
}

function groupHitsByPage(hits: SearchHit[]) {
  const groups: { pageUrl: string; hits: SearchHit[] }[] = [];
  for (const hit of hits) {
    if (hit.type === "page") {
      groups.push({ pageUrl: hit.url.replace(URL_ANCHOR, ""), hits: [] });
      continue;
    }
    groups.at(-1)?.hits.push(hit);
  }
  return groups;
}

const TITLE_MATCH_WEIGHT = 10;
const DESCRIPTION_MATCH_WEIGHT = 2;
const QUERY_TOKENS = /[\p{L}\p{N}]+/gu;

interface RankedPage {
  summary: DocsPageSummary;
  hits: SearchHit[];
  score: number;
}

function queryTokens(query: string) {
  return (query.toLowerCase().match(QUERY_TOKENS) ?? []).filter((token) => token.length > 1);
}

function countMatches(text: string, tokens: string[]) {
  const haystack = text.toLowerCase();
  return tokens.filter((token) => haystack.includes(token)).length;
}

function scorePage(summary: DocsPageSummary, hits: SearchHit[], tokens: string[]) {
  return (
    countMatches(summary.title, tokens) * TITLE_MATCH_WEIGHT +
    countMatches(summary.description, tokens) * DESCRIPTION_MATCH_WEIGHT +
    hits.length
  );
}

function rankPages(hits: SearchHit[], tokens: string[]) {
  const ranked: RankedPage[] = [];
  for (const group of groupHitsByPage(hits)) {
    const page = source.getPageByUrl(group.pageUrl);
    if (!page) continue;
    const summary = docsPageSummary(page);
    ranked.push({ summary, hits: group.hits, score: scorePage(summary, group.hits, tokens) });
  }
  return ranked.sort((left, right) => right.score - left.score);
}

export async function searchDocs(query: string, limit: number): Promise<DocsSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const hits = await searchServer.search(trimmed);
  return rankPages(hits, queryTokens(trimmed))
    .slice(0, limit)
    .map(({ summary, hits: pageHits }) => ({ ...pageEntry(summary), excerpt: excerptFor(pageHits, summary.description) }));
}

export function listDocsPages(): DocsPageEntry[] {
  return docsPageGroups().flatMap((group) => group.pages.map(pageEntry));
}

export function listDocsComponents(): DocsComponentEntry[] {
  return docsPageGroups()
    .flatMap((group) => group.pages)
    .filter((summary) => summary.slugs[0] === CATALOG_SLUG && summary.slugs.length === 2)
    .map((summary) => ({
      name: summary.title,
      description: summary.description,
      url: absoluteUrl(summary.path),
      markdownUrl: absoluteUrl(summary.markdownPath),
    }));
}

export async function getDocsPageMarkdown(slug: string) {
  const page = source.getPage(slug.split("/").filter((segment) => segment.length > 0));
  if (!page) return undefined;
  const summary = docsPageSummary(page);
  return docsPageMarkdown(summary, await docsPageRaw(summary));
}

export const inProcessDocsBackend: DocsBackend = {
  search: searchDocs,
  getPage: getDocsPageMarkdown,
  listComponents: async () => listDocsComponents(),
};
