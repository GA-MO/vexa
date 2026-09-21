import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

export const scenario: Scenario = {
  id: "admin-discover",
  measures: "steering",
  title: "The model asks for discovery when it does not know where something lives",
  controlPath: "user prompt on /settings, nothing discovered yet → admin_discover {} → the hidden frame walks the app → routes + observed → the model names the products page",
  page: "/settings",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "Where do I manage products?",
      expectToolsAnyOf: [["admin_discover"], ["admin_observe", "admin_discover"], ["admin_observe", "admin_discover", "admin_observe"], ["admin_observe", "admin_discover", "admin_run"]],
      expectText: /products/i,
      expectPage: { path: "/settings" },
    },
  ],
  mock: [
    {
      match: /where do i manage products/i,
      steps: [
        { reasoning: "The settings page has nothing about products and I have not seen the rest of the app, so I ask discovery to look, which does not move the user." },
        {
          tool: "admin_discover",
          input: {},
          then: [{ text: "Products live on the Products page (/products): it lists every product with a search box and a Create product link, and each row opens the product for editing." }],
          onError: [{ text: "I could not look through the app from here; open the Products link in the navigation and I will take it from there." }],
        },
      ],
    },
  ],
  bestPractice:
    "`admin_discover` is the model's way to learn the app without moving the user: it walks the pages in a hidden frame and returns `routes` and `observed`; it is read-only, answers from the last discovery while that is fresh, and reports `DISCOVERY_UNAVAILABLE` with the reason when the app cannot be framed, after which the model navigates and looks.",
};
