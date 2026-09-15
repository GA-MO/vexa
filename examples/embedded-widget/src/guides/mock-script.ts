import type { Spec } from "vexa/protocol";
import type { MockScript, MockTurn } from "../../../shared/mock-model";

export const PROMPTS = {
  usage: "Show my plan usage",
  usageGerman: "Zeig mir meine Tarifnutzung",
  help: "What can you help with?",
} as const;

const USAGE_SPEC: Spec = {
  root: "usage",
  elements: {
    usage: { type: "Card", props: { title: "Pro plan", description: "Billing period ends in 12 days" }, children: ["metrics", "storage", "upgrade"] },
    metrics: { type: "Grid", props: { columns: "2", gap: "sm" }, children: ["notes", "shares"] },
    notes: { type: "Metric", props: { label: "Notes", value: "1,284", detail: "+96 this month", trend: "up" }, children: [] },
    shares: { type: "Metric", props: { label: "Shared with you", value: "37", detail: "3 new", trend: "neutral" }, children: [] },
    storage: { type: "Progress", props: { label: "Storage", value: 72, detail: "7.2 of 10 GB" }, children: [] },
    upgrade: {
      type: "Button",
      props: { label: "Upgrade to Team", variant: "primary" },
      children: [],
      on: { press: [{ action: "toast", params: { message: "The upgrade flow would open here." } }] },
    },
  },
};

const USAGE_SPEC_GERMAN: Spec = {
  root: "usage",
  elements: {
    usage: { type: "Card", props: { title: "Pro-Tarif", description: "Der Abrechnungszeitraum endet in 12 Tagen" }, children: ["metrics", "storage", "upgrade"] },
    metrics: { type: "Grid", props: { columns: "2", gap: "sm" }, children: ["notes", "shares"] },
    notes: { type: "Metric", props: { label: "Notizen", value: "1.284", detail: "+96 in diesem Monat", trend: "up" }, children: [] },
    shares: { type: "Metric", props: { label: "Mit dir geteilt", value: "37", detail: "3 neue", trend: "neutral" }, children: [] },
    storage: { type: "Progress", props: { label: "Speicher", value: 72, detail: "7,2 von 10 GB" }, children: [] },
    upgrade: {
      type: "Button",
      props: { label: "Auf Team upgraden", variant: "primary" },
      children: [],
      on: { press: [{ action: "toast", params: { message: "Hier würde das Upgrade starten." } }] },
    },
  },
};

const HELP_SPEC: Spec = {
  root: "help",
  elements: {
    help: {
      type: "List",
      props: {
        ordered: false,
        items: ["Explain any feature of Acme Notes", "Show your plan, storage and sharing at a glance", "Draft a note from a few keywords"],
      },
      children: [],
    },
  },
};

const TURNS: MockTurn[] = [
  { match: /plan usage/i, steps: [{ text: "Here is your plan this month." }, { spec: USAGE_SPEC }] },
  { match: /tarifnutzung/i, steps: [{ text: "Hier ist deine Nutzung in diesem Monat." }, { spec: USAGE_SPEC_GERMAN }] },
  { match: /what can you help/i, steps: [{ text: "Three things, right from this page:" }, { spec: HELP_SPEC }] },
];

/** Every reply the widget's mock model can give; the prompts are what it lists when a message matches nothing. */
export const WIDGET_MOCK_SCRIPT: MockScript = { turns: TURNS, prompts: Object.values(PROMPTS) };
