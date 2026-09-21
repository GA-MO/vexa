import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const STEPS = [{ action: "click", target: { role: "link", name: "/kettle/i" } }];

export const scenario: Scenario = {
  id: "admin-ambiguous",
  measures: "steering",
  title: "An ambiguous target returns candidates instead of a guess",
  controlPath: "user prompt → admin_run [click the kettle link] → two products match → TARGET_AMBIGUOUS + candidates → model asks which one",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "Open the kettle product",
      expectToolsAnyOf: [["admin_run"], ["admin_observe", "admin_run"], ["admin_observe"], ["admin_observe", "admin_run", "admin_run"]],
      expectText: /which|\?|gooseneck|electric/i,
    },
  ],
  mock: [
    {
      match: /^open the kettle product$/i,
      steps: [
        { reasoning: "The products table has a link per product. I click the one named kettle; if more than one matches, the executor returns the candidates and I ask instead of guessing." },
        {
          tool: "admin_run",
          input: { steps: STEPS },
          then: [{ text: "Opened the kettle." }],
          onError: [{ text: "There are two kettles: the Gooseneck kettle and the Electric kettle. Which one should I open?" }],
        },
      ],
    },
  ],
  bestPractice:
    "When several elements match, the executor returns TARGET_AMBIGUOUS with up to five candidates (name and the row or group they sit in) so the model can ask or pick one by nth; it never clicks the first match silently.",
};
