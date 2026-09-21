import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";
import { DELETE_MOCK_TURN, DELETE_PRODUCT_ID, DELETE_PRODUCT_NAME, DELETE_PROMPT, DELETE_TOOLS_INCLUDE } from "./admin-delete-product";

export const scenario: Scenario = {
  id: "admin-delete-declined",
  measures: "steering",
  attempts: 2,
  title: "Cancel in the app's dialog keeps the product; the model reads the page before answering",
  controlPath:
    "user prompt → admin_run [click the product link, click Delete product] → the app's alertdialog opens → run stops → user presses Cancel → product still listed → model confirms from the page, no retry",
  page: "/products",
  docs: "host/admin",
  context: { path: "/products" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: DELETE_PROMPT,
      expectToolsInclude: DELETE_TOOLS_INCLUDE,
      expectText: /confirm|dialog/i,
      expectPage: { dialogOpen: true, textPresent: DELETE_PRODUCT_NAME },
    },
    { pageClick: "Cancel", expectPage: { dialogOpen: false, textPresent: DELETE_PRODUCT_NAME } },
    {
      user: "Did it get deleted?",
      expectText: /still|not deleted|wasn'?t deleted|cancel|remains|has not been/i,
      expectStore: { label: `${DELETE_PRODUCT_NAME} is still in the store`, check: (state) => state.products.some((product) => product.id === DELETE_PRODUCT_ID) },
    },
  ],
  mock: [
    DELETE_MOCK_TURN,
    {
      match: /^did it get deleted\?$/i,
      steps: [
        { reasoning: "I read the page rather than guess what the user pressed in the dialog." },
        {
          tool: "admin_observe",
          input: {},
          then: [{ text: `No. ${DELETE_PRODUCT_NAME} is still on this page, so the dialog was cancelled and nothing changed.` }],
          onError: [{ text: "I could not read the page, so I cannot tell either way." }],
        },
      ],
    },
  ],
  bestPractice:
    "The model never learns what the user pressed in the app's dialog from the chat; it reads the page afterwards and reports what is there, so a cancelled dialog is reported as unchanged and never retried.",
};
