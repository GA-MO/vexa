import { listDocsPages } from "@/lib/docs-api";

const JSON_HEADERS = { "Cache-Control": "public, max-age=300" };

export function loader() {
  return Response.json({ pages: listDocsPages() }, { headers: JSON_HEADERS });
}
