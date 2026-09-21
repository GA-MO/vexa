import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const STALE_STEPS = [
  { action: "navigate", to: "Create product" },
  { action: "click", target: "t1" },
];

export const scenario: Scenario = {
  id: "admin-stale",
  measures: "steering",
  kind: "check",
  title: "A ref from a page that was left fails with TARGET_STALE, never a guess",
  controlPath: "user prompt → admin_observe (refs for /products) → admin_run [navigate Create product, click <ref from /products>] → TARGET_STALE + new page → model re-observes",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "Click the Create product link, then click the products table",
      expectToolsAnyOf: [["admin_run"], ["admin_observe", "admin_run"], ["admin_observe", "admin_run", "admin_observe"], ["admin_observe", "admin_run", "admin_run"]],
      expectText: /stale|changed|no longer|new page|previous page|not (on|found|find)|left|isn'?t|no table|doesn'?t|could ?n'?o?t click|couldn'?t|wasn'?t able|was not able|not able|only available|unable|after moving/i,
    },
  ],
  mock: [
    {
      match: /click the create product link, then click the products table/i,
      steps: [
        { reasoning: "I observe the products page to get refs, then navigate and try the table ref from the page I just left." },
        {
          tool: "admin_observe",
          input: {},
          then: [
            {
              tool: "admin_run",
              input: { steps: STALE_STEPS },
              then: [{ text: "Clicked the table." }],
              onError: [{ text: "The Create product link opened the new product page, so the products table from the previous page is no longer there; I will look at this page again before doing anything else." }],
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "Refs are valid only for the page they were observed on: a ref used after a navigate fails with TARGET_STALE and the trace carries the new page, so the model re-observes instead of clicking whatever now sits at that position.",
};
