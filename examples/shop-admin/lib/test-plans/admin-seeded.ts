import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

export const scenario: Scenario = {
  id: "admin-seeded",
  measures: "steering",
  title: "Pages discovered on an earlier visit answer without navigating",
  controlPath: "an earlier automatic discovery left the pages in storage → restored at startup → user prompt on /settings → admin_observe { path: /products } answers cached: true → the model describes the page without navigating",
  page: "/settings",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  seeded: true,
  script: [
    {
      user: "What can I do on the products page?",
      expectToolsAnyOf: [["admin_observe"], ["admin_observe", "admin_run"], ["admin_discover", "admin_observe"]],
      expectText: /product|create|search|table/i,
      expectPage: { path: "/settings" },
    },
  ],
  mock: [
    {
      match: /what can i do on the products page/i,
      steps: [
        { reasoning: "The products page is in observed, so I read it from memory instead of leaving the settings page." },
        {
          tool: "admin_observe",
          input: { path: "/products" },
          then: [{ text: "The products page (from memory) has a Create product link, a search box and a table of products with name, SKU, category, price and status." }],
          onError: [{ text: "I have not seen the products page yet; open it and ask again." }],
        },
      ],
    },
  ],
  bestPractice:
    "Discovery runs by itself in a hidden frame after the app loads and its result is kept per origin and user (`scope`) for a day, so the second visit starts with every page known; a live observation of the same path always replaces the stored copy, so storage can only be stale, never wrong about a page the user has opened.",
};
