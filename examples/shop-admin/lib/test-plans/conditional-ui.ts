import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const INITIAL_ROWS = [
  { id: "C-1040", label: "Order C-1040" },
  { id: "C-1041", label: "Order C-1041" },
];

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: ["details-switch", "details-panel", "add-row-btn", "rows-list"],
    },
    "details-switch": {
      type: "Switch",
      props: { label: "Show details", name: "showDetails", hint: null, checked: { $bindState: "/ui/showDetails" }, disabled: false },
    },
    "details-panel": {
      type: "Text",
      props: { content: "Extra details are visible now.", muted: false },
      visible: { $state: "/ui/showDetails" },
    },
    "add-row-btn": {
      type: "Button",
      props: { label: "Add order C-1042", variant: "secondary" },
      on: { press: [{ action: "pushState", params: { statePath: "/ui/rows", value: { id: "C-1042", label: "Order C-1042" } } }] },
    },
    "rows-list": { type: "Stack", props: { direction: "vertical", gap: "sm" }, children: ["row-label", "row-select-btn"] },
    "row-label": {
      type: "Text",
      props: { content: { $template: "${label}" }, muted: true },
      repeat: { statePath: "/ui/rows", key: "id" },
    },
    "row-select-btn": {
      type: "Button",
      props: { label: "Select", variant: "secondary" },
      repeat: { statePath: "/ui/rows", key: "id" },
      on: { press: [{ action: "runTool", params: { name: "select_order", input: { id: { $item: "id" } } } }] },
    },
  },
};

export const scenario: Scenario = {
  id: "conditional-ui",
  measures: "runtime",
  title: "Switch visibility, repeat push, and $item reach the right handlers",
  controlPath: "Switch → visible; pushState into a repeat array; per-item Button runTool → { $item: 'id' } resolves to the pressed row",
  page: "/guides/conditional-ui",
  docs: "state",
  opener: "Show the order picker with details",
  fixture: { spec, state: { ui: { showDetails: false, rows: INITIAL_ROWS } } },
  tools: {
    select_order: (input) => ({ ok: true, summary: `Selected ${String(input.id)}`, data: { id: input.id } }),
  },
  script: [
    { expectState: { "/ui/showDetails": false } },
    { type: { path: "/ui/showDetails", value: true } },
    { expectState: { "/ui/showDetails": true } },
    { press: "add-row-btn", expectState: { "/ui/rows": [...INITIAL_ROWS, { id: "C-1042", label: "Order C-1042" }] } },
    { press: "row-select-btn", item: "C-1042", expectNoModelTurn: true, expectState: { "/tools/select_order/id": "C-1042" } },
  ],
  bestPractice:
    "A per-item Button only needs { $item: 'field' } in its runTool params, never a unique id per row: the driver (and the real RepeatScopeProvider) resolves the pressed row from repeat.statePath + repeat.key before the action ever sees the params.",
};
