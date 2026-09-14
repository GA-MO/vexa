import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["step-indicator", "step1-panel", "step2-panel"] },
    "step-indicator": { type: "Text", props: { content: { $template: "Step ${/ui/step} of 2" }, muted: true } },
    "step1-panel": {
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      visible: { $state: "/ui/step", eq: 1 },
      children: ["name-input", "next-btn"],
    },
    "name-input": {
      type: "Input",
      props: {
        label: "Name",
        name: "name",
        placeholder: "Alex Kim",
        inputType: "text",
        value: { $bindState: "/ui/form/name" },
        checks: null,
        validateOn: null,
      },
    },
    "next-btn": { type: "Button", props: { label: "Next", variant: "primary" }, on: { press: [{ action: "setState", params: { statePath: "/ui/step", value: 2 } }] } },
    "step2-panel": {
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      visible: { $state: "/ui/step", eq: 2 },
      children: ["email-input", "back-btn", "submit-btn"],
    },
    "email-input": {
      type: "Input",
      props: {
        label: "Email",
        name: "email",
        placeholder: "you@company.com",
        inputType: "email",
        value: { $bindState: "/ui/form/email" },
        checks: null,
        validateOn: null,
      },
    },
    "back-btn": { type: "Button", props: { label: "Back", variant: "secondary" }, on: { press: [{ action: "setState", params: { statePath: "/ui/step", value: 1 } }] } },
    "submit-btn": {
      type: "Button",
      props: { label: "Submit", variant: "primary" },
      on: {
        press: [
          { action: "submitForm", params: { statePath: "/ui/lastSubmit" } },
          { action: "toast", params: { message: "Booked" } },
        ],
      },
    },
  },
};

export const scenario: Scenario = {
  id: "multi-step",
  title: "A two-step wizard keeps state across next and back",
  controlPath: "step gated by visible + $state → Next/Back setState /ui/step → both steps' /ui/form values survive → submitForm sees both",
  page: "/tests/multi-step",
  fixture: { spec, state: { ui: { step: 1, form: { name: "", email: "" }, lastSubmit: null } } },
  script: [
    { expectState: { "/ui/step": 1 } },
    { type: { path: "/ui/form/name", value: "Alex Kim" } },
    { press: "next-btn", expectState: { "/ui/step": 2 } },
    { type: { path: "/ui/form/email", value: "alex@example.com" } },
    { press: "back-btn", expectState: { "/ui/step": 1, "/ui/form/name": "Alex Kim" } },
    { press: "next-btn", expectState: { "/ui/step": 2, "/ui/form/email": "alex@example.com" } },
    { press: "submit-btn", expectToast: "Booked" },
    { expectState: { "/ui/lastSubmit/form/name": "Alex Kim", "/ui/lastSubmit/form/email": "alex@example.com" } },
  ],
  bestPractice:
    "Tabs in the catalog is display-only text, not a container, so a real multi-step wizard is two Stacks gated by visible: { $state: '/ui/step', eq: N } with Next/Back doing plain setState — the same /ui/form/* paths stay bound the whole time, so switching steps never clears what was typed.",
};
