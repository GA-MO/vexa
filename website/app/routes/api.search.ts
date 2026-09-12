import { createFromSource } from "fumadocs-core/search/server";
import type { InferPageType } from "fumadocs-core/source";
import { searchTagFor } from "@/lib/docs-sections";
import { source } from "@/lib/source";

type DocsPage = InferPageType<typeof source>;

function buildIndex(page: DocsPage) {
  return {
    id: page.url,
    url: page.url,
    title: page.data.title ?? page.slugs.at(-1) ?? page.url,
    description: page.data.description,
    tag: searchTagFor(page.slugs),
    structuredData: page.data.structuredData,
  };
}

const searchServer = createFromSource(source, { buildIndex });

export function loader() {
  return searchServer.staticGET();
}
