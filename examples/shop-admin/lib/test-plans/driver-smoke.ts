import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["label", "press-me"] },
    label: { type: "Text", props: { content: "Press the button and read /ui/pressed", muted: true } },
    "press-me": {
      type: "Button",
      props: { label: "Mark as pressed", variant: "primary" },
      on: { press: [{ action: "setState", params: { statePath: "/ui/pressed", value: true } }] },
    },
  },
};

export const scenario: Scenario = {
  id: "driver-smoke",
  measures: "runtime",
  kind: "check",
  title: "Headless driver presses a spec button",
  controlPath: "fixture Button → on.press setState → /ui/pressed",
  page: "/guides/driver-smoke",
  fixture: { spec, state: { ui: { pressed: false } } },
  script: [
    { expectState: { "/ui/pressed": false } },
    { press: "press-me", expectState: { "/ui/pressed": true }, expectNoModelTurn: true },
  ],
  bestPractice:
    "A spec action that only changes local state (setState) never needs the model or the host; assert it with the same store and handlers the UI uses.",
};
