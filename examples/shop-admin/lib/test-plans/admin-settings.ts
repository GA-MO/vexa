import type { Scenario } from "@/lib/scenarios/types";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const STEPS = [{ action: "select", target: { role: "combobox", name: "Steps display" }, value: "hidden" }];

export const scenario: Scenario = {
  id: "admin-settings",
  measures: "steering",
  title: "Model changes a setting that has no tool through the page's own control",
  controlPath: "user prompt → admin_observe → admin_run [select Steps display → hidden] → executor drives the real select → trace + page",
  page: "/settings",
  docs: "host/admin",
  context: { path: "/settings" },
  hostTools: adminHostToolDescriptors(),
  domPage: true,
  script: [
    {
      user: "Switch the steps display setting to hidden",
      expectToolsInclude: ["admin_run"],
      expectStore: { label: "the steps display setting is hidden", check: (state) => state.steps === "hidden" },
    },
  ],
  mock: [
    {
      match: /steps display setting to hidden/i,
      steps: [
        { reasoning: "No host tool covers the steps display, so I look at the settings page for the control." },
        {
          tool: "admin_observe",
          input: {},
          then: [
            { reasoning: "Steps display is a combobox with collapsible and hidden. One select step; it changes a setting, not a record, so no confirmation is needed." },
            {
              tool: "admin_run",
              input: { steps: STEPS },
              then: [{ text: "Thinking steps are hidden now; the chat shows only the reply and any approval card." }],
              onError: [{ text: "I could not change the steps display: the control on the settings page did not respond as expected, so nothing was changed." }],
            },
          ],
        },
      ],
    },
  ],
  bestPractice:
    "A setting with no host tool is still one admin_run call: observe once, then select by accessible name; fill, select and check never ask for confirmation because they change the form, not the record.",
};
