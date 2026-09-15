import { index, route, type RouteConfig } from "@react-router/dev/routes";

const STATIC_BUILD = process.env.VITE_VEXA_STATIC === "1";

const STATIC_ROUTES = [
  index("routes/home.tsx"),
  route("docs/:group?/:section?/:page.md", "routes/docs.md.ts"),
  route("docs/*", "routes/docs.tsx"),
  route("playground", "routes/playground.tsx"),
  route("changelog", "routes/changelog.tsx"),
  route("api/search", "routes/api.search.ts"),
  route("llms.txt", "routes/llms.txt.ts"),
  route("llms-full.txt", "routes/llms-full.txt.ts"),
  route("sitemap.xml", "routes/sitemap.xml.ts"),
  route("robots.txt", "routes/robots.txt.ts"),
  route("404.html", "routes/not-found.tsx"),
];

const SERVER_ROUTES = [
  route("api/chat", "routes/api.chat.ts"),
  route("api/assistant", "routes/api.assistant.ts"),
  route("api/docs/search", "routes/api.docs.search.ts"),
  route("api/docs/pages", "routes/api.docs.pages.ts"),
  route("api/docs/components", "routes/api.docs.components.ts"),
  route("mcp", "routes/mcp.ts"),
  route("api/health", "routes/api.health.ts"),
];

export default [...STATIC_ROUTES, ...(STATIC_BUILD ? [] : SERVER_ROUTES)] satisfies RouteConfig;
