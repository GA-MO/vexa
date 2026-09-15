import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: ["email-input", "name-input", "check-btn", "submit-btn"],
    },
    "email-input": {
      type: "Input",
      props: {
        label: "Email",
        name: "email",
        placeholder: "you@company.com",
        inputType: "email",
        value: { $bindState: "/ui/form/email" },
        checks: [
          { type: "required", message: "Email is required", args: null },
          { type: "email", message: "Enter a valid email", args: null },
        ],
        validateOn: "blur",
      },
    },
    "name-input": {
      type: "Input",
      props: {
        label: "Name",
        name: "name",
        placeholder: "Alex Kim",
        inputType: "text",
        value: { $bindState: "/ui/form/name" },
        checks: [{ type: "required", message: "Name is required", args: null }],
        validateOn: "blur",
      },
    },
    "check-btn": {
      type: "Button",
      props: { label: "Check", variant: "secondary" },
      on: { press: [{ action: "validateForm", params: { statePath: "/ui/formResult" } }] },
    },
    "submit-btn": {
      type: "Button",
      props: { label: "Submit", variant: "primary" },
      visible: { $state: "/ui/formResult/valid" },
      on: {
        press: [
          { action: "submitForm", params: { statePath: "/ui/lastSubmit" } },
          { action: "toast", params: { message: "Submitted" } },
        ],
      },
    },
  },
};

export const scenario: Scenario = {
  id: "validation",
  title: "validateForm blocks submitForm until every check passes",
  controlPath: "empty Input + checks → press Check → validateForm invalid → fix fields → Check → valid → Submit → submitForm",
  page: "/guides/validation",
  docs: "actions",
  opener: "Show the sign-up form with validation",
  fixture: { spec, state: { ui: { form: { email: "", name: "" }, formResult: null, lastSubmit: null } } },
  script: [
    { press: "check-btn", expectState: { "/ui/formResult/valid": false } },
    { expectState: { "/ui/lastSubmit": null } },
    { type: { path: "/ui/form/email", value: "alex@example.com" } },
    { type: { path: "/ui/form/name", value: "Alex Kim" } },
    { press: "check-btn", expectState: { "/ui/formResult/valid": true, "/ui/formResult/errors": {} } },
    { press: "submit-btn", expectToast: "Submitted" },
    { expectState: { "/ui/lastSubmit/form/email": "alex@example.com", "/ui/lastSubmit/form/name": "Alex Kim" } },
  ],
  bestPractice:
    "validateForm never stops the actions after it in the same on.press array; Vexa's submitForm reads /formValidation itself so [validateForm, submitForm] blocks an invalid submit, but any other follow-up action (toast, runTool) must be gated with visible on the validation result.",
};
