import type { MockScript } from "vexa/mock";
import type { Spec } from "vexa/protocol";

const CAPABILITIES: Spec = {
  root: "list",
  elements: {
    list: {
      type: "List",
      props: {
        ordered: false,
        items: ["Answer questions about the app", "Render cards, metrics, tables and charts in place", "Call the tools you register on the provider"],
      },
      children: [],
    },
  },
};

const EXAMPLE_UI: Spec = {
  root: "card",
  elements: {
    card: { type: "Card", props: { title: "Acme this week", description: "Generated from the catalog, not hand-written" }, children: ["grid", "cta"] },
    grid: { type: "Grid", props: { columns: "2", gap: "sm" }, children: ["signups", "revenue"] },
    signups: { type: "Metric", props: { label: "Sign-ups", value: "312", detail: "+18% vs last week", trend: "up" }, children: [] },
    revenue: { type: "Metric", props: { label: "Revenue", value: "$8,420", detail: "+6% vs last week", trend: "up" }, children: [] },
    cta: {
      type: "Button",
      props: { label: "Open the report", variant: "primary" },
      children: [],
      on: { press: [{ action: "toast", params: { message: "A host tool would open the report here." } }] },
    },
  },
};

/** What the free mock answers, matched against the last user message; anything else lists these prompts. */
export const MOCK_SCRIPT: MockScript = {
  turns: [
    { match: /what can you do/i, steps: [{ text: "Three things, right from this page:" }, { spec: CAPABILITIES }] },
    { match: /example|show me/i, steps: [{ text: "Here is a small dashboard the catalog can express." }, { spec: EXAMPLE_UI }] },
  ],
  prompts: ["What can you do?", "Show me an example of the UI you can build"],
};
