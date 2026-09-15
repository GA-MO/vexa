import type { Spec } from "vexa/protocol";
import { hostToolDescriptor } from "@/lib/shop/host-tools";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["revenue", "hint", "set-locale-button"] },
    revenue: {
      type: "Metric",
      props: {
        label: "Revenue this month",
        value: { $computed: "formatCurrency", args: { value: 128000 } },
        detail: null,
        trend: null,
      },
    },
    hint: {
      type: "Text",
      props: {
        content: "Press the button: the number above reformats immediately because it reads the live host format.",
        muted: true,
      },
    },
    "set-locale-button": {
      type: "Button",
      props: { label: "Switch to th-TH / THB", variant: "primary" },
      on: { press: [{ action: "runTool", params: { name: "set_locale", input: { locale: "th-TH", currency: "THB" } } }] },
    },
  },
};

export const scenario: Scenario = {
  id: "theme-format",
  title: "Theme and locale change tokens and formatting live",
  controlPath: "Button runTool set_locale → format reflows Metric; model calls set_theme → confirm → dark palette",
  page: "/settings",
  docs: "host/theme",
  opener: "Show this month's revenue",
  fixture: { spec },
  hostTools: [hostToolDescriptor("set_theme")],
  tools: {
    set_locale: (input) => ({
      ok: true,
      summary: `Locale ${input.locale}, currency ${input.currency}`,
      data: { locale: input.locale, currency: input.currency },
    }),
    set_theme: {
      confirm: true,
      run: (input) => ({ ok: true, summary: `Theme set to ${input.theme}`, data: { theme: input.theme } }),
    },
  },
  script: [
    {
      press: "set-locale-button",
      expectState: { "/tools/set_locale": { locale: "th-TH", currency: "THB" } },
      expectNoModelTurn: true,
    },
    { user: "Switch to dark theme", expectTools: ["set_theme"] },
    { approve: "set_theme", expectText: /dark/i },
  ],
  mock: [
    {
      match: /switch to dark theme/i,
      steps: [
        { reasoning: "set_theme opens its own confirmation prompt in the app, so I call it right away instead of asking in chat." },
        {
          tool: "set_theme",
          input: { theme: "dark" },
          then: [{ text: "The admin is now in the dark theme." }],
          onError: [{ text: "The theme was not changed: the switch was declined." }],
        },
      ],
    },
  ],
  bestPractice:
    "A confirm: true tool description must say the tool opens its own confirmation prompt (\"do not ask the user to confirm in chat first\"), or the model asks in text and never calls the tool at all; bind values through $computed so a runTool call reformats every bound number without a page reload.",
};
