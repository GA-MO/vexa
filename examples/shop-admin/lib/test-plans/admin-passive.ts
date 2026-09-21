import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

export const scenario: Scenario = {
  id: "admin-passive",
  measures: "steering",
  title: "Pages the user visited are remembered without any tool call",
  controlPath: "user opens /products, then /settings (passive cache records both) → user prompt → admin_observe { path: /products } answers cached: true → the model describes it (a small model may still navigate to read the rows)",
  page: "/products",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    { pageNavigate: "/settings", expectPage: { path: "/settings" } },
    {
      user: "What was on the products page?",
      expectToolsInclude: ["admin_observe"],
      expectText: /product|beans|equipment|create|search|table|sku/i,
    },
  ],
  mock: [
    {
      match: /what was on the products page/i,
      steps: [
        { reasoning: "The user was on the products page a moment ago, so it is in observed; I read it from memory instead of navigating back." },
        {
          tool: "admin_observe",
          input: { path: "/products" },
          then: [{ text: "The products page you just left has a Create product link, a search box and a table of products with name, SKU, category, price and status." }],
          onError: [{ text: "I have no memory of the products page yet; open it once and ask again." }],
        },
      ],
    },
  ],
  bestPractice:
    "Leave `passive` on: every page the user lands on is snapshotted after it settles (about a millisecond, no navigation), so by the time they ask, the pages they actually use are readable from memory; turn it off only for pages that must never be captured.",
};
