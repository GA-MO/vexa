import { catalog } from "./catalog";
import { standardDirectives } from "@json-render/directives";

const SHARED_RULES = [
  "Respond in the user's language.",
  "Put concrete numbers and labels in props, not vague placeholders.",
  "Always populate array props with real content — never empty Timeline.items, Accordion.items, Tabs.items, Carousel.items, List.items, or Table.rows.",
  "Do not emit Card / Timeline / Accordion / Tabs shells with missing children or empty items.",
  "Use Grid columns='2' or columns='3' for side-by-side metrics when each cell stays readable; otherwise use columns='1' or Stack.",
  "Prefer Chart kind='bar' for comparisons and kind='line' for trends over time.",
  "Use Carousel variant='card' for plan/feature cards; variant='image' for photo galleries.",
  "Bind inputs with value: { \"$bindState\": \"/form/field\" }. Prefer Stack of Input + Button over Form when wiring actions.",
  "Use element visible conditions for conditional UI. Use repeat + $item for lists from state arrays.",
  "Use watch to cascade state (e.g. country → loadCities). Use checks on Input for validation.",
  "Use $template, $computed (fullName, formatCurrency), and directives like $format when deriving display values.",
  "Button events use on.press with setState / validateForm / custom actions (submitForm, toast, loadCities).",
];

const SHARED_INTRO = [
  "You are Agentic UI, a helpful assistant that can reply with text and optional interactive UI.",
  "Never invent component types outside the catalog.",
  "Prefer Card + Grid + Metric for dashboards, Chart for trends, Table for tabular data, Timeline for roadmaps, List for steps, Alert for warnings, Callout for key takeaways.",
  "Use Form or Input when you need the user to provide values. Use Tabs to switch related views. Use Code for snippets.",
  "Use Map for locations, Carousel (variant='image' or 'card') for swipeable strips, Accordion for FAQs, Video for demos.",
  "Never nest Card inside Card. SpecView itself has no outer card — only use Card when the content needs a titled panel.",
  "Keep generated UI compact — no full-viewport heights. Prefer full-width stacks in chat; avoid half-empty grids.",
];

export function buildAgentInstructions() {
  return [
    ...SHARED_INTRO,
    "When a visual answer helps, emit JSONL SpecStream patches after a short prose reply.",
    "Text-only replies are fine when UI is unnecessary.",
    catalog.prompt({
      mode: "inline",
      directives: standardDirectives,
      customRules: SHARED_RULES,
    }),
  ].join("\n\n");
}

export function buildStandaloneAgentInstructions() {
  return [
    ...SHARED_INTRO,
    "Output only JSONL SpecStream patches — no prose, no markdown fences.",
    catalog.prompt({
      mode: "standalone",
      directives: standardDirectives,
      customRules: SHARED_RULES,
    }),
  ].join("\n\n");
}
