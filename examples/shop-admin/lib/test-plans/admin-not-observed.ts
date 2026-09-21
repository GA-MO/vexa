import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

export const scenario: Scenario = {
  id: "admin-not-observed",
  measures: "steering",
  title: "A page nobody has visited is PAGE_NOT_OBSERVED, with the routes that exist",
  controlPath: "user prompt on /settings → admin_observe { path: /products } → PAGE_NOT_OBSERVED + routes → admin_run [navigate /products] (or admin_discover first) → the trace carries the page → model describes it",
  page: "/settings",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "What's on the products page?",
      expectToolsAnyOf: [["admin_observe"], ["admin_run"], ["admin_observe", "admin_run"], ["admin_discover", "admin_observe"], ["admin_discover", "admin_observe", "admin_run"], ["admin_observe", "admin_discover", "admin_run"]],
      expectText: /product|open|navigate|visit/i,
    },
  ],
  mock: [
    {
      match: /what'?s on the products page/i,
      steps: [
        { reasoning: "The user asks about another page. If it was observed before I can read it from memory; otherwise the result tells me which routes exist and I go there." },
        {
          tool: "admin_observe",
          input: { path: "/products" },
          then: [{ text: "The products page (from memory) has a Create product link, a search box and a table of products with name, SKU, category, price and status." }],
          onError: [
            { reasoning: "Not observed yet, but /products is in the routes. I navigate there; the trace item carries the page so I can describe it without another call." },
            {
              tool: "admin_run",
              input: { steps: [{ action: "navigate", to: "/products" }] },
              then: [{ text: "I opened the products page: it has a Create product link, a search box and a table of products with name, SKU, category, price and status." }],
              onError: [{ text: "I could not open the products page from here." }],
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "`admin_observe { path }` never guesses: an unvisited page returns `PAGE_NOT_OBSERVED` together with `routes`, so the model navigates (the trace item carries the new page) or calls `admin_discover`, instead of inventing what the page contains.",
};
