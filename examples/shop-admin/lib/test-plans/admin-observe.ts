import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

export const scenario: Scenario = {
  id: "admin-observe",
  measures: "steering",
  title: "Model reads the page through the accessibility tree",
  controlPath: "user prompt → admin_observe → snapshot (refs, roles, names, values) → answer from the snapshot",
  page: "/settings",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [{ user: "What can I change on this page?", expectTools: ["admin_observe"], expectText: /locale|theme|currency/i }],
  mock: [
    {
      match: /what can i change/i,
      steps: [
        { reasoning: "I have not seen this page in this turn, so I observe it before answering; the snapshot lists every control with its role, name and current value." },
        {
          tool: "admin_observe",
          input: {},
          then: [
            {
              text: "On this page you can switch the theme (light or dark), pick the locale (en-US or de-DE), the currency (USD or EUR) and how chat steps are displayed (collapsible or hidden).",
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "With VexaProvider admin enabled the model reads the page through admin_observe (roles, accessible names, values) instead of a per-page tool, so every control that has an accessible name is visible to it without host code; an unnamed control shows up only in the unnamed count.",
};
