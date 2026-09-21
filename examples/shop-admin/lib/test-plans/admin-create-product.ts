import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const PRODUCT = { name: "Cold brew bottle", sku: "CB-500", price: "12.50", category: "Beans", status: "active" };

const STEPS = [
  { action: "navigate", to: "Create product" },
  { action: "fill", target: { role: "textbox", name: "Name" }, value: PRODUCT.name },
  { action: "fill", target: { role: "textbox", name: "SKU" }, value: PRODUCT.sku },
  { action: "fill", target: { role: "spinbutton", name: "Price" }, value: PRODUCT.price },
  { action: "select", target: { role: "combobox", name: "Category" }, value: PRODUCT.category },
  { action: "select", target: { role: "combobox", name: "Status" }, value: PRODUCT.status },
  { action: "submit", target: { role: "button", name: "Create product" } },
];

export const scenario: Scenario = {
  id: "admin-create-product",
  measures: "steering",
  attempts: 2,
  title: "Model creates a record through the app's own form",
  controlPath: "user prompt → admin_observe → admin_run [navigate, fill ×3, select ×2, submit] → product list shows the new row",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: `Add a new product: ${PRODUCT.name}, SKU ${PRODUCT.sku}, $${PRODUCT.price}, category ${PRODUCT.category}, ${PRODUCT.status}`,
      expectToolsInclude: ["admin_run"],
      expectStore: {
        label: `the products store holds ${PRODUCT.name} (${PRODUCT.sku}) at ${PRODUCT.price} in ${PRODUCT.category}, status ${PRODUCT.status}`,
        check: (state) => state.products.some((product) => product.name === PRODUCT.name && product.sku === PRODUCT.sku && product.price === Number(PRODUCT.price) && product.category === PRODUCT.category && product.status === PRODUCT.status),
      },
    },
  ],
  mock: [
    {
      match: /add a new product: cold brew bottle/i,
      steps: [
        { reasoning: "No product tool exists, so I look at the page for the way in: a Create product link." },
        {
          tool: "admin_observe",
          input: {},
          then: [
            { reasoning: "One plan: open the form through the link, fill the three text fields, pick the category in the custom select and the status in the native one, then submit. The app's own form validation is the gate; nothing asks first." },
            {
              tool: "admin_run",
              input: { steps: STEPS },
              then: [{ text: `Created ${PRODUCT.name} (${PRODUCT.sku}) at ${PRODUCT.price} in ${PRODUCT.category}, status ${PRODUCT.status}. It is in the products list now.` }],
              onError: [{ text: "I could not finish creating the product: a step in the form did not go through, so nothing was saved." }],
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "A create flow is one admin_run plan: navigate through the page's own link, fill and select by accessible name (a custom combobox is opened and its option clicked like a user would), then submit; under the default confirm policy nothing asks first, the app's own form validation and dialogs are the gate.",
};
