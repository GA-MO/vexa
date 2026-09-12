import { clampSearchLimit, searchDocs } from "@/lib/docs-api";
import type { Route } from "./+types/api.docs.search";

const JSON_HEADERS = { "Cache-Control": "public, max-age=60" };

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = clampSearchLimit(url.searchParams.get("limit"));
  const results = await searchDocs(query, limit);
  return Response.json({ query, results }, { headers: JSON_HEADERS });
}
