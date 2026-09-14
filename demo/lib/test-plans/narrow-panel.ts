import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const COUNTRIES = [
  { value: "th", label: "Thailand" },
  { value: "sg", label: "Singapore" },
  { value: "my", label: "Malaysia" },
  { value: "vn", label: "Vietnam" },
  { value: "ph", label: "Philippines" },
  { value: "id", label: "Indonesia" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
];

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["country-select", "plans-carousel", "orders-table"] },
    "country-select": {
      type: "Select",
      props: { label: "Ship to", name: "country", placeholder: "Choose a country", options: COUNTRIES, value: null, disabled: false },
    },
    "plans-carousel": {
      type: "Carousel",
      props: {
        variant: "card",
        items: [
          { src: null, alt: null, caption: null, title: "Starter", description: "For a single espresso bar", badge: null },
          { src: null, alt: null, caption: null, title: "Growth", description: "For two to five locations", badge: "Popular" },
          { src: null, alt: null, caption: null, title: "Scale", description: "For a regional chain", badge: null },
          { src: null, alt: null, caption: null, title: "Enterprise", description: "Custom rollout and support", badge: null },
        ],
      },
    },
    "orders-table": {
      type: "Table",
      props: {
        columns: [
          { key: "id", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "city", label: "City" },
          { key: "status", label: "Status" },
          { key: "items", label: "Items" },
          { key: "total", label: "Total" },
          { key: "createdAt", label: "Created" },
        ],
        rows: [
          { id: "C-1042", customer: "Napat Srisuwan", city: "Bangkok", status: "pending", items: 2, total: 1100, createdAt: "2026-09-11" },
          { id: "C-1041", customer: "Ploy Chaiyaporn", city: "Chiang Mai", status: "paid", items: 1, total: 960, createdAt: "2026-09-11" },
          { id: "C-1040", customer: "Ben Carter", city: "Phuket", status: "shipped", items: 3, total: 2250, createdAt: "2026-09-10" },
        ],
      },
    },
  },
};

export const scenario: Scenario = {
  id: "narrow-panel",
  title: "Select, Carousel, and a wide Table at 340px",
  controlPath: "fixture only — checked by hand in a 340px chat panel",
  page: "/tests/narrow-panel",
  fixture: { spec },
  script: [],
  manualChecks: [
    "Open the Select at 340px: its popover opens fully inside the viewport, not clipped or pushed off the right edge.",
    "Drag the Carousel left and right: it scrolls smoothly and snaps to a card, without dragging the surrounding chat panel.",
    "Scroll the Table horizontally inside its own container: only the table scrolls, the chat panel itself does not move.",
  ],
  bestPractice:
    "A Select, a Carousel, and a wide Table all need their own overflow container at 340px — Select's popover must not exceed the viewport, Carousel needs pointer/touch drag scoped to itself, and Table needs its own overflow-x-auto so the surrounding chat panel never scrolls sideways.",
};
