import { listDocsComponents } from "@/lib/docs-api";

const JSON_HEADERS = { "Cache-Control": "public, max-age=300" };

export function loader() {
  return Response.json({ components: listDocsComponents() }, { headers: JSON_HEADERS });
}
