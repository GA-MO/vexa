import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const GITHUB_URL = "https://github.com/sbpds/vexa";
export const DOCS_CONTENT_GITHUB_URL = `${GITHUB_URL}/blob/main/website/content/docs`;

function Wordmark() {
  return (
    <span className="bg-gradient-to-r from-primary to-brand-violet bg-clip-text font-display text-lg font-semibold tracking-tight text-transparent">
      Vexa
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      url: "/",
    },
    githubUrl: GITHUB_URL,
    links: [
      { text: "Docs", url: "/docs", active: "nested-url" },
      { text: "Examples", url: "/docs/examples", active: "nested-url" },
      { text: "Playground", url: "/playground" },
      { text: "Changelog", url: "/changelog" },
    ],
  };
}
