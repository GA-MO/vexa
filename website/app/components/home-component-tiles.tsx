import { Link } from "react-router";
import { SpecView } from "vexa/react";
import type { GallerySection } from "vexa/examples";
import { STRIP_SECTIONS } from "@/lib/home-strip-sections";

const CATALOG_BASE_URL = "/docs/catalog";

function componentNames(section: GallerySection) {
  return section.component.split(",").map((name) => name.trim());
}

function ComponentTile({ section }: { section: GallerySection }) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg shadow-primary/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {componentNames(section).map((name) => (
            <Link
              key={name}
              to={`${CATALOG_BASE_URL}/${name}`}
              className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {name}
            </Link>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{section.note}</span>
      </div>
      <div className="min-w-0 rounded-xl border border-border/60 bg-background p-3">
        <SpecView showDevtools={false} spec={section.spec} />
      </div>
    </article>
  );
}

export function HomeComponentTiles() {
  return (
    <>
      {STRIP_SECTIONS.map((section) => (
        <ComponentTile key={section.id} section={section} />
      ))}
    </>
  );
}
