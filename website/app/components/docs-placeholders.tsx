import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { Link } from "react-router";
import { ComingSoon } from "@/components/coming-soon";
import { DOCS_DOORS, DOCS_SECTIONS, type DocsSection } from "@/lib/docs-sections";

const PLACEHOLDER_PAGE_OPTIONS = {
  tableOfContent: { enabled: false },
  tableOfContentPopover: { enabled: false },
  breadcrumb: { enabled: false },
  footer: { enabled: false },
} as const;

function Door({ slug, title, description }: DocsSection) {
  return (
    <Link
      to={`/docs/${slug}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 no-underline shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        {title}
      </span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </Link>
  );
}

export function DocsHome() {
  return (
    <DocsPage {...PLACEHOLDER_PAGE_OPTIONS}>
      <title>Vexa documentation</title>
      <DocsTitle>Vexa documentation</DocsTitle>
      <DocsDescription>
        A chat overlay that answers with text plus real components, constrained to a catalog your
        app controls.
      </DocsDescription>
      <DocsBody>
        <div className="not-prose grid gap-4 sm:grid-cols-3">
          {DOCS_DOORS.map((door) => (
            <Door key={door.slug} {...door} />
          ))}
        </div>
        <h2>All sections</h2>
        <ul>
          {DOCS_SECTIONS.map((section) => (
            <li key={section.slug}>
              <Link to={`/docs/${section.slug}`}>{section.title}</Link>: {section.description}
            </li>
          ))}
        </ul>
      </DocsBody>
    </DocsPage>
  );
}

export function DocsSectionPlaceholder({ title, description }: DocsSection) {
  return (
    <DocsPage {...PLACEHOLDER_PAGE_OPTIONS}>
      <title>{`${title} | Vexa`}</title>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <ComingSoon title={title} description={description} />
      </DocsBody>
    </DocsPage>
  );
}
