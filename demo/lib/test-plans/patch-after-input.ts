import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["name-input"] },
    "name-input": {
      type: "Input",
      props: {
        label: "Name",
        name: "name",
        placeholder: "Alex Kim",
        inputType: "text",
        value: { $bindState: "/ui/name" },
        checks: null,
        validateOn: null,
      },
    },
  },
};

export const scenario: Scenario = {
  id: "patch-after-input",
  title: "A follow-up patch keeps the typed value and the existing spec",
  controlPath: "type /ui/name → user asks for more UI → model patches the existing root (same ids) → /ui/name untouched",
  page: "/tests/patch-after-input",
  fixture: { spec },
  priorAssistantSpec: spec,
  script: [
    { type: { path: "/ui/name", value: "Nam Srisuk" } },
    { user: "Add a Submit button under the name field", expectDataParts: ["data-spec"] },
    { expectSpec: { root: { exists: true }, "name-input": { exists: true } } },
    { expectState: { "/ui/name": "Nam Srisuk" } },
  ],
  bestPractice:
    "A follow-up that only adds to a spec already on screen must be answered with patches against the same root and element ids, never a new root — the state store and the elements the user already typed into are keyed by those ids, so replacing them silently loses input.",
};
