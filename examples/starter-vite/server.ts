import path from "node:path";
import { createVexaHandler } from "vexa/server";
import { models } from "./src/models";

const PORT = Number(process.env.API_PORT ?? 3006);
const DIST = path.join(import.meta.dir, "dist");
const PERSONA = "You are the assistant of Acme, a small SaaS product. Answer briefly and render UI when it helps.";

const { GET, POST } = createVexaHandler({ models, persona: PERSONA });

async function serveBuiltPage(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const file = Bun.file(path.join(DIST, pathname === "/" ? "index.html" : pathname));
  if (await file.exists()) return new Response(file);
  return new Response(Bun.file(path.join(DIST, "index.html")));
}

Bun.serve({
  port: PORT,
  routes: { "/api/chat": { GET, POST } },
  fetch: serveBuiltPage,
});

console.log(`Vexa chat route on http://localhost:${PORT}/api/chat`);
