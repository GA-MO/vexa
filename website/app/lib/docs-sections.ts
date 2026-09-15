export interface DocsSection {
  slug: string;
  title: string;
  description: string;
}

export type DocsGroupId = "start" | "integrate" | "reference";

export interface DocsGroup {
  id: DocsGroupId;
  title: string;
  description: string;
  sections: DocsSection[];
}

const GET_STARTED: DocsSection = {
  slug: "get-started",
  title: "Get started",
  description: "Install, wrap your app in VexaProvider, add the chat route, and send a first prompt.",
};

const EXAMPLES: DocsSection = {
  slug: "examples",
  title: "Examples",
  description: "Example apps with playable guides: pick the one that looks like yours and open its guides.",
};

const CONFIG_REFERENCE: DocsSection = {
  slug: "config-reference",
  title: "Config reference",
  description: "Every createVexaHandler and VexaProvider option on one page, annotated and copy-pasteable.",
};

/** Sidebar groups by reader: Start and Integrate for a host developer, Reference for personas, agents, and the catalog. */
export const DOCS_GROUPS: DocsGroup[] = [
  {
    id: "start",
    title: "Start",
    description: "Install the package and see what a reply looks like in an app like yours.",
    sections: [GET_STARTED, EXAMPLES],
  },
  {
    id: "integrate",
    title: "Integrate",
    description: "The provider, the route, host tools, runTool, approval, theme, labels, and the config reference.",
    sections: [
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
      CONFIG_REFERENCE,
    ],
  },
  {
    id: "reference",
    title: "Reference",
    description: "The catalog, actions, state, the spec stream, recipes, security, and agent access.",
    sections: [
      {
        slug: "catalog",
        title: "Catalog",
        description: "Every component the assistant can render, with props tables and live examples.",
      },
      {
        slug: "actions",
        title: "Actions",
        description: "submitForm, toast, and runTool: the three built-in spec actions.",
      },
      {
        slug: "state",
        title: "State",
        description: "The spec state store, reserved namespaces, and the expressions that read and write it.",
      },
      {
        slug: "spec-stream",
        title: "Spec stream",
        description: "How JSONL patch lines become a spec and render as catalog components.",
      },
      {
        slug: "recipes",
        title: "Recipes",
        description: "Order status card, booking form, dashboard, receipts, i18n, dark mode.",
      },
      {
        slug: "security",
        title: "Security",
        description: "Trust boundary, threat model, what the library enforces, what the host must do.",
      },
      {
        slug: "agents",
        title: "Agents",
        description: "Markdown pages, llms.txt, the JSON search API, and the vexa-docs MCP server for coding agents.",
      },
    ],
  },
];

export const DOCS_SECTIONS: DocsSection[] = DOCS_GROUPS.flatMap((group) => group.sections);

/** The three tiles on the docs home: Start and Integrate only; Reference is reached through the sidebar and search. */
export const DOCS_DOORS: DocsSection[] = [GET_STARTED, EXAMPLES, CONFIG_REFERENCE];

const GROUP_BY_SLUG = new Map(DOCS_GROUPS.flatMap((group) => group.sections.map((section) => [section.slug, group])));

export function findDocsSection(slugs: string[]) {
  const [first] = slugs;
  if (!first) return undefined;
  return DOCS_SECTIONS.find((section) => section.slug === first);
}

export interface SearchSection {
  tag: string;
  title: string;
}

export const SEARCH_SECTIONS: SearchSection[] = DOCS_GROUPS.map(({ id, title }) => ({ tag: id, title }));

export function searchTagFor(slugs: string[]) {
  const [first] = slugs;
  return (first && GROUP_BY_SLUG.get(first)?.id) ?? "docs";
}

export function searchSectionTitleFor(tag: string) {
  return SEARCH_SECTIONS.find((section) => section.tag === tag)?.title ?? "Docs";
}
