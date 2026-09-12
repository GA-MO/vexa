import { stepCountIs, tool } from "ai";
import { z } from "zod";
import { createVexaHandler } from "vexa/server";
import { EXAMPLE_PAGES } from "virtual:example-pages";
import { searchDocs } from "@/lib/docs-api";
import { playgroundModels, playgroundProviderOptions } from "@/lib/models.server";

const SEARCH_LIMIT = 6;
const MAX_STEPS = 6;

const ASSISTANT_RULES = [
  "Answer only from what search_docs returns. Call search_docs before answering any question about Vexa; when the docs do not cover it, say so instead of guessing.",
  "Link every page you mention as a Markdown link to its site path, for example [Host tools](/docs/host/host-tools).",
  "Every answer comes with a page: after search_docs, open the single most relevant result in the same turn with open_section (page plus the heading that answers the question), navigate (whole page), or run_example (a live example). Do not ask whether to open it; open it, then answer in one to three sentences relative to what is now on screen.",
  "When the user asks to see, open, or show a page, section, or example, the tool call is the answer; never only describe where something is.",
  "run_example takes an example id from the examples field of a search_docs result, for example line-items for a receipt.",
  "Reply in short Markdown prose. The docs pages already render every example, so do not generate catalog UI after run_example, navigate, or open_section; generate UI only when the user explicitly asks you to render a component in the chat.",
];

function currentPageLine(context: Record<string, unknown>) {
  const path = typeof context.path === "string" ? context.path : null;
  const title = typeof context.title === "string" ? context.title : null;
  if (!path) return "The user is browsing the Vexa docs site.";
  return `The user is reading ${title ? `"${title}"` : "a page"} at ${path}. Answer relative to that page when it is relevant.`;
}

function examplesOn(path: string) {
  return Object.entries(EXAMPLE_PAGES)
    .filter(([, pages]) => pages.includes(path))
    .map(([id]) => id);
}

function toAssistantHit(result: Awaited<ReturnType<typeof searchDocs>>[number]) {
  const path = new URL(result.url).pathname;
  return { title: result.title, section: result.section, path, excerpt: result.excerpt, examples: examplesOn(path) };
}

const searchDocsTool = tool({
  description: "Search the Vexa documentation. Returns matching pages with their site path, an excerpt, and the ids of live examples rendered on each page.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Free-text query, for example 'host tool' or 'receipt'"),
  }),
  execute: async ({ query }) => (await searchDocs(query, SEARCH_LIMIT)).map(toAssistantHit),
});

export const { GET: getAssistantModels, POST: postAssistant } = createVexaHandler({
  persona: ({ today, context }) => [
    "You are the Vexa docs guide. You help developers find, open, and understand the documentation of Vexa, the React library for constrained generative chat UI.",
    currentPageLine(context),
    `Today is ${today}.`,
  ],
  rules: ASSISTANT_RULES,
  models: playgroundModels,
  providerOptions: playgroundProviderOptions,
  tools: { search_docs: searchDocsTool },
  stopWhen: stepCountIs(MAX_STEPS),
});
