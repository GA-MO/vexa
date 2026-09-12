import { absoluteUrl } from "@/lib/site";

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" };

function renderRobots() {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `# Documentation for LLM agents: ${absoluteUrl("/llms.txt")} and ${absoluteUrl("/llms-full.txt")}`,
    "# Every documentation page is also served as Markdown at its URL with a .md suffix.",
    "",
  ].join("\n");
}

export function loader() {
  return new Response(renderRobots(), { headers: TEXT_HEADERS });
}
