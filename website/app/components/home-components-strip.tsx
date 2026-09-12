import { ArrowRight } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { HomeSection } from "@/components/home-section";
import { STRIP_SECTIONS } from "@/lib/home-strip-sections";

const CATALOG_BASE_URL = "/docs/catalog";

const HomeComponentTiles = lazy(() =>
  import("@/components/home-component-tiles").then((module) => ({
    default: module.HomeComponentTiles,
  })),
);

function TilesFallback() {
  return (
    <>
      {STRIP_SECTIONS.map((section) => (
        <article
          key={section.id}
          className="flex min-h-56 min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg shadow-primary/5"
        >
          <span className="w-fit rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {section.component}
          </span>
          <span className="text-xs text-muted-foreground">{section.note}</span>
        </article>
      ))}
    </>
  );
}

export function HomeComponentsStrip() {
  return (
    <HomeSection
      id="components"
      eyebrow="Catalog"
      title="Forty-one components, sized for a chat panel"
      lede="Every tile below is the library rendering a spec, not a screenshot. Charts measure their container, colors come from your tokens, and everything works in the dark."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<TilesFallback />}>
          <HomeComponentTiles />
        </Suspense>
      </div>
      <Link
        to={CATALOG_BASE_URL}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground shadow-md shadow-primary/10 transition hover:border-primary/50 hover:text-primary"
      >
        Browse the whole catalog
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </HomeSection>
  );
}
