import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const STEPS = [{ action: "click", target: { role: "button", name: "Export" } }];

export const scenario: Scenario = {
  id: "admin-not-found",
  measures: "steering",
  title: "A missing target stops the plan with a structured error",
  controlPath: "user prompt → admin_run [click Export] → TARGET_NOT_FOUND (or admin_observe finds no Export) → model reports what the page has, no retry",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "Export the products to CSV",
      expectText: /no export|not (find|found|see|have|offer|support)|don'?t (see|have)|isn'?t|is not|does not (exist|have)|there is no|no such|no way|cannot|can'?t|csv/i,
      expectStore: { label: "the products are unchanged", check: (state) => state.products.length === 9 },
    },
  ],
  mock: [
    {
      match: /^export the products to csv$/i,
      steps: [
        { reasoning: "No tool exports products, so I try the page: an Export button would do it. If there is none the trace says so and I answer from the returned page instead of retrying." },
        {
          tool: "admin_run",
          input: { steps: STEPS },
          then: [{ text: "Exported the products." }],
          onError: [
            {
              text: "This admin has no export: the products page offers a search box, the Create product link and the table itself, nothing that downloads or exports. I can filter or read the rows for you instead.",
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "A target that does not resolve ends the plan with TARGET_NOT_FOUND and the current page, never a guessed click; the model answers from that page and does not retry the same target.",
};
