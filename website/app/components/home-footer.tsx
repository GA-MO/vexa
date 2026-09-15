import { Link } from "react-router";
import { GITHUB_URL } from "@/lib/layout.shared";

type FooterLink = { label: string; href: string; external?: boolean };

const FOOTER_COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Get started", href: "/docs/get-started" },
      { label: "Examples", href: "/docs/examples" },
      { label: "Catalog", href: "/docs/catalog" },
      { label: "Playground", href: "/playground" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "Changelog", href: "/changelog" },
      { label: "Security", href: "/docs/security" },
      { label: "GitHub", href: GITHUB_URL, external: true },
    ],
  },
  {
    heading: "For agents",
    links: [
      { label: "llms.txt", href: "/llms.txt", external: true },
      { label: "llms-full.txt", href: "/llms-full.txt", external: true },
      { label: "Search API", href: "/api/search?q=host%20tools", external: true },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  const className = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  if (link.external) {
    return (
      <a href={link.href} className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function HomeFooter() {
  return (
    <footer className="w-full border-t border-border bg-card/60 px-4 py-12 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-10 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-3">
          <span className="bg-gradient-to-r from-primary to-brand-violet bg-clip-text font-display text-2xl font-semibold tracking-tight text-transparent">
            Vexa
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Generative UI for any React app, constrained to a catalog your app controls.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              {column.heading}
            </p>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <FooterAnchor link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
