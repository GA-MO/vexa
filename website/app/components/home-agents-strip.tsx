import { Bot, FileText, ListTree } from "lucide-react";
import { HomeSection } from "@/components/home-section";

type AgentSurface = {
  icon: typeof Bot;
  title: string;
  body: string;
  href: string;
  path: string;
};

const AGENT_SURFACES: AgentSurface[] = [
  {
    icon: ListTree,
    title: "llms.txt",
    body: "One line per page with a summary, so an agent picks the right document before fetching it.",
    href: "/llms.txt",
    path: "/llms.txt",
  },
  {
    icon: FileText,
    title: "Raw Markdown per page",
    body: "Append .md to any docs URL for the page as plain Markdown, frontmatter stripped, tables inlined.",
    href: "/docs/get-started.md",
    path: "/docs/<slug>.md",
  },
  {
    icon: Bot,
    title: "Everything in one file",
    body: "The whole site concatenated with a Source line per section, for tools that want a single fetch.",
    href: "/llms-full.txt",
    path: "/llms-full.txt",
  },
];

const CURL_LINES = [
  "curl -s <site>/docs/host/host-tools.md",
  "# Host tools",
  "",
  "A host tool is a function that runs in the browser: navigate, scroll",
  "to a section, switch the theme, read the cart. You register it once",
  "on VexaProvider with a description and an input schema…",
];

function SurfaceCard({ surface }: { surface: AgentSurface }) {
  const Icon = surface.icon;
  return (
    <a
      href={surface.href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-lg shadow-primary/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15"
    >
      <span className="flex items-center gap-2 text-foreground">
        <Icon className="size-4 text-primary" aria-hidden />
        <span className="font-display text-lg font-semibold tracking-tight">{surface.title}</span>
      </span>
      <p className="text-sm leading-relaxed text-muted-foreground">{surface.body}</p>
      <code className="mt-auto w-fit rounded-md bg-muted px-2 py-1 font-mono text-xs text-primary">
        {surface.path}
      </code>
    </a>
  );
}

function Terminal() {
  return (
    <pre className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card p-4 font-mono text-[13px] leading-relaxed text-foreground shadow-lg shadow-primary/10">
      <code>
        {CURL_LINES.map((line, index) => (
          <span key={index} className={index === 0 ? "text-primary" : "text-muted-foreground"}>
            {index === 0 ? "$ " : ""}
            {line}
            {"\n"}
          </span>
        ))}
      </code>
    </pre>
  );
}

export function HomeAgentsStrip() {
  return (
    <HomeSection
      id="agents"
      eyebrow="Built for agents"
      title="Spectacle on the surface, plain text underneath"
      lede="Every page on this site is also a Markdown document. Claude Code, Cursor, or any HTTP client can read the docs without scraping HTML."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {AGENT_SURFACES.map((surface) => (
            <SurfaceCard key={surface.href} surface={surface} />
          ))}
        </div>
        <Terminal />
      </div>
    </HomeSection>
  );
}
