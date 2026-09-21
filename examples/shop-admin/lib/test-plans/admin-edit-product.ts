import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const PRODUCT_NAME = "Gooseneck kettle";
const NEW_PRICE = "89";

const STEPS = [
  { action: "click", target: { role: "link", name: PRODUCT_NAME } },
  { action: "fill", target: { role: "spinbutton", name: "Price" }, value: NEW_PRICE },
  { action: "submit", target: { role: "button", name: "Save product" } },
];

export const scenario: Scenario = {
  id: "admin-edit-product",
  measures: "steering",
  title: "Model opens a record from its table and saves a change",
  controlPath: "user prompt → admin_run [click row link, fill Price, submit Save] → back on the list with the new price",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: `Change the gooseneck kettle price to $${NEW_PRICE}`,
      expectToolsInclude: ["admin_run"],
      expectStore: { label: `the Gooseneck kettle costs ${NEW_PRICE}`, check: (state) => state.products.find((product) => product.id === "P-1004")?.price === Number(NEW_PRICE) },
    },
  ],
  mock: [
    {
      match: /change the gooseneck kettle price/i,
      steps: [
        { reasoning: "The product name is a link in the table, so I click it, then change the price on the form and save. Save is the app's own commit; nothing asks first." },
        {
          tool: "admin_run",
          input: { steps: STEPS },
          then: [{ text: `${PRODUCT_NAME} now costs ${NEW_PRICE}.` }],
          onError: [{ text: `I could not save the new price for ${PRODUCT_NAME}; the form was not submitted, so the price is unchanged.` }],
        },
      ],
    },
  ],
  bestPractice:
    "An edit flow clicks the record's own link in the table, fills only the field that changes and submits; because the plan is one admin_run call the model never sees the intermediate page and the app's own Save is the commit.",
};
