import { GALLERY_SECTIONS, type GallerySection } from "vexa/examples";

const STRIP_SECTION_IDS = [
  "metric",
  "line-chart",
  "progress",
  "rating",
  "timeline",
  "key-value",
  "from-to",
  "line-items",
  "badge",
];

const SECTION_BY_ID = new Map(GALLERY_SECTIONS.map((section) => [section.id, section] as const));

export const STRIP_SECTIONS = STRIP_SECTION_IDS.map((id) => SECTION_BY_ID.get(id)).filter(
  (section): section is GallerySection => Boolean(section),
);
