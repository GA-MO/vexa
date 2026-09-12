import { docsPageMarkdown, docsPageSummary } from "@/lib/markdown";
import { source } from "@/lib/source";
import type { Route } from "./+types/docs.md";

const MARKDOWN_HEADERS = { "Content-Type": "text/markdown; charset=utf-8" };

function slugsFromParams(params: Route.LoaderArgs["params"]) {
  return [params.group, params.section, params.page].filter(
    (segment): segment is string => typeof segment === "string" && segment.length > 0,
  );
}

export async function loader({ params }: Route.LoaderArgs) {
  const page = source.getPage(slugsFromParams(params));
  if (!page) throw new Response("Not found", { status: 404 });

  const markdown = docsPageMarkdown(docsPageSummary(page), await page.data.getText("raw"));
  return new Response(markdown, { headers: MARKDOWN_HEADERS });
}
