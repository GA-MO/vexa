import { Link } from "react-router";
import { GALLERY_SECTIONS, PRIMITIVE_GROUPS, type GallerySection } from "vexa/examples";
import { SpecView } from "vexa/react";
import { ChatWidthFrame } from "@/components/chat-width-frame";
import { DOCS_BASE_URL } from "@/lib/source";

const CATALOG_BASE_URL = `${DOCS_BASE_URL}/catalog`;
const GROUP_HEADING_DEPTH = 2;
const UNGROUPED_LABEL = "Other";

type GalleryGroup = { id: string; label: string; sections: GallerySection[] };

const SECTION_BY_ID = new Map(GALLERY_SECTIONS.map((section) => [section.id, section] as const));

function sectionsWithIds(ids: string[]) {
  return ids
    .map((id) => SECTION_BY_ID.get(id))
    .filter((section): section is GallerySection => Boolean(section));
}

function sectionsInNoGroup() {
  const grouped = new Set(PRIMITIVE_GROUPS.flatMap((group) => group.sections));
  return GALLERY_SECTIONS.filter((section) => !grouped.has(section.id));
}

const GALLERY_GROUPS: GalleryGroup[] = [
  ...PRIMITIVE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    sections: sectionsWithIds(group.sections),
  })),
  { id: "other", label: UNGROUPED_LABEL, sections: sectionsInNoGroup() },
].filter((group) => group.sections.length > 0);

function groupAnchorId(groupId: string) {
  return `group-${groupId}`;
}

function componentNames(section: GallerySection) {
  return section.component.split(",").map((name) => name.trim());
}

function ComponentLinks({ section }: { section: GallerySection }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {componentNames(section).map((name) => (
        <Link
          key={name}
          to={`${CATALOG_BASE_URL}/${name}`}
          className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground no-underline transition-colors hover:border-primary/40 hover:text-primary"
        >
          {name}
        </Link>
      ))}
    </div>
  );
}

function GalleryEntry({ section }: { section: GallerySection }) {
  return (
    <article id={section.id} className="not-prose my-8 flex scroll-mt-24 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h4 className="font-display text-base font-semibold tracking-tight text-foreground">
            <a href={`#${section.id}`} className="no-underline hover:text-primary">
              {section.title}
            </a>
          </h4>
          <p className="text-sm text-muted-foreground">{section.note}</p>
        </div>
        <ComponentLinks section={section} />
      </div>
      <ChatWidthFrame>
        <SpecView showDevtools={false} spec={section.spec} />
      </ChatWidthFrame>
    </article>
  );
}

function GalleryGroupSection({ group }: { group: GalleryGroup }) {
  return (
    <section>
      <h3 id={groupAnchorId(group.id)} className="scroll-mt-24">
        {group.label}
      </h3>
      {group.sections.map((section) => (
        <GalleryEntry key={section.id} section={section} />
      ))}
    </section>
  );
}

/** Every gallery example grouped by primitive, rendered live at chat width. Used from the catalog index MDX. */
export function CatalogGallery() {
  return (
    <>
      {GALLERY_GROUPS.map((group) => (
        <GalleryGroupSection key={group.id} group={group} />
      ))}
    </>
  );
}
