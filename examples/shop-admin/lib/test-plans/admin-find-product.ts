import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const PRODUCT_NAME = "Gooseneck kettle";

const STEPS = [
  { action: "fill", target: { role: "searchbox", name: "Search products" }, value: "gooseneck" },
  { action: "click", target: { role: "link", name: PRODUCT_NAME, within: { role: "table", name: "/.*/" } } },
];

export const scenario: Scenario = {
  id: "admin-find-product",
  measures: "steering",
  title: "Model searches a table and opens the matching row",
  controlPath: "user prompt → admin_run [fill search, click the row link inside the table] → product page opens → trace",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "Find the gooseneck kettle and open it",
      expectToolsInclude: ["admin_run"],
      expectPage: { path: "/products/P-1004" },
    },
  ],
  mock: [
    {
      match: /find the gooseneck kettle and open it/i,
      steps: [
        { reasoning: "There is no product tool, so I use the page: type into the search box, then click the product's own link inside the table. Neither step commits anything." },
        {
          tool: "admin_run",
          input: { steps: STEPS },
          then: [{ text: `Opened ${PRODUCT_NAME}. It is an Equipment product, SKU EQ-KET.` }],
          onError: [{ text: `I searched the products, but no row named ${PRODUCT_NAME} was found, so nothing was opened.` }],
        },
      ],
    },
  ],
  bestPractice:
    "Elements inside a table are addressed with within (the table or a row) plus nth, and a read step returns the rows, so the model can search, inspect and open a record without the page exposing an id anywhere.",
};
