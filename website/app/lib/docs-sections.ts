export interface DocsSection {
  slug: string;
  title: string;
  description: string;
}

export const DOCS_DOORS: DocsSection[] = [
  {
    slug: "get-started",
    title: "Get started",
    description: "Install, wrap your app in VexaProvider, add the chat route, and send a first prompt.",
  },
  {
    slug: "host",
    title: "Host integration",
    description: "VexaProvider, host tools, runTool, format, labels, theme, and models.",
  },
  {
    slug: "catalog",
    title: "Catalog",
    description: "Every component the assistant can render, with props tables and live examples.",
  },
];

export const DOCS_SECTIONS: DocsSection[] = [
  {
    slug: "concepts",
    title: "Concepts",
    description: "How it works: spec stream, catalog, state namespaces, host tools, security.",
  },
  {
    slug: "host",
    title: "Host integration",
    description: "VexaProvider, host tools, runTool, format, labels, theme, and models.",
  },
  {
    slug: "server",
    title: "Server",
    description: "createVexaHandler, models registry, persona and rules, MCP, guard.",
  },
  {
    slug: "catalog",
    title: "Catalog",
    description: "Component index generated from the catalog, one page per component.",
  },
  {
    slug: "actions",
    title: "Actions",
    description: "submitForm, toast, and runTool: the three built-in spec actions.",
  },
  {
    slug: "recipes",
    title: "Recipes",
    description: "Order status card, booking form, dashboard, receipts, i18n, dark mode.",
  },
  {
    slug: "security",
    title: "Security",
    description: "Threat model, what the library enforces, what the host must do.",
  },
  {
    slug: "agents",
    title: "Agents",
    description: "Markdown pages, llms.txt, the JSON search API, and the vexa-docs MCP server for coding agents.",
  },
  {
    slug: "reference",
    title: "Reference",
    description: "Every exported type, generated from the source.",
  },
];

export function findDocsSection(slugs: string[]) {
  const [first] = slugs;
  if (!first) return undefined;
  return DOCS_SECTIONS.find((section) => section.slug === first);
}

export interface SearchSection {
  tag: string;
  title: string;
}

export const SEARCH_SECTIONS: SearchSection[] = [
  { tag: "get-started", title: "Get started" },
  { tag: "concepts", title: "Concepts" },
  { tag: "host", title: "Host integration" },
  { tag: "server", title: "Server" },
  { tag: "catalog", title: "Catalog" },
  { tag: "actions", title: "Actions" },
  { tag: "recipes", title: "Recipes" },
  { tag: "security", title: "Security" },
];

export function searchTagFor(slugs: string[]) {
  const [first] = slugs;
  return first ?? "docs";
}

export function searchSectionTitleFor(tag: string) {
  return SEARCH_SECTIONS.find((section) => section.tag === tag)?.title ?? "Docs";
}
