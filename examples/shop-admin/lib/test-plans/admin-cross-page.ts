import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const PRODUCT = { name: "Pour-over stand", sku: "PS-10", price: "39", category: "Equipment", status: "active" };

const STEPS = [
  { action: "navigate", to: "/products/new" },
  { action: "fill", target: { role: "textbox", name: "Name" }, value: PRODUCT.name },
  { action: "fill", target: { role: "textbox", name: "SKU" }, value: PRODUCT.sku },
  { action: "fill", target: { role: "spinbutton", name: "Price" }, value: PRODUCT.price },
  { action: "select", target: { role: "combobox", name: "Category" }, value: PRODUCT.category },
  { action: "select", target: { role: "combobox", name: "Status" }, value: PRODUCT.status },
  { action: "submit", target: { role: "button", name: "Create product" } },
];

export const scenario: Scenario = {
  id: "admin-cross-page",
  measures: "steering",
  attempts: 2,
  title: "After discovery, a task on another page is one plan",
  controlPath: "discover pages → user prompt on /settings → admin_observe { path: /products/new } answers from memory → one admin_run [navigate, fill ×3, select ×2, submit] → product created",
  page: "/settings",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  discover: true,
  script: [
    {
      user: `Add a product called ${PRODUCT.name}, SKU ${PRODUCT.sku}, $${PRODUCT.price}, ${PRODUCT.category}`,
      expectToolsInclude: ["admin_run"],
      expectStore: { label: `the products store holds ${PRODUCT.name} (${PRODUCT.sku})`, check: (state) => state.products.some((product) => product.name === PRODUCT.name && product.sku === PRODUCT.sku) },
    },
  ],
  mock: [
    {
      match: /add a product called pour-over stand/i,
      steps: [
        { reasoning: "I am on the settings page. The products form was discovered earlier, so I read it from memory instead of going there first." },
        {
          tool: "admin_observe",
          input: { path: "/products/new" },
          then: [
            { reasoning: "The form has Name, SKU, Price, a Category combobox and a Status select. One plan: navigate there, fill, select, submit; the app's own form is the gate." },
            {
              tool: "admin_run",
              input: { steps: STEPS },
              then: [{ text: `Created ${PRODUCT.name} (${PRODUCT.sku}) at ${PRODUCT.price} in ${PRODUCT.category}, status ${PRODUCT.status}, straight from the settings page.` }],
              onError: [{ text: "I could not finish creating the product: a step in the form did not go through, so nothing was saved." }],
            },
          ],
          onError: [
            {
              tool: "admin_run",
              input: { steps: [{ action: "navigate", to: "/products/new" }] },
              then: [{ text: "The products form had not been discovered yet, so I opened it first. Ask again and I will fill it in." }],
              onError: [{ text: "I could not open the products form." }],
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "Once a page has been discovered or visited, `admin_observe { path }` answers from memory, so a task that starts elsewhere still fits one `admin_run` that begins with `navigate` and addresses the form by role and name; discovery is read-only and runs in a hidden frame, automatically after load or when the model asks.",
};
