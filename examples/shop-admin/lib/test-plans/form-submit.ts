import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["heading", "email", "name", "submit", "confirmation"] },
    heading: { type: "Heading", props: { text: "Request access", level: "3" } },
    email: {
      type: "Input",
      props: {
        label: "Email",
        name: "email",
        placeholder: "you@company.com",
        inputType: "email",
        value: { $bindState: "/form/email" },
        checks: [
          { type: "required", message: "Email is required", args: null },
          { type: "email", message: "Enter a valid email", args: null },
        ],
        validateOn: "blur",
      },
    },
    name: {
      type: "Input",
      props: {
        label: "Name",
        name: "name",
        placeholder: "Alex Kim",
        inputType: "text",
        value: { $bindState: "/form/name" },
        checks: [{ type: "required", message: "Name is required", args: null }],
        validateOn: "blur",
      },
    },
    submit: {
      type: "Button",
      props: { label: "Submit", variant: "primary" },
      on: {
        press: [
          { action: "validateForm" },
          { action: "submitForm", params: { statePath: "/lastSubmit" } },
          { action: "toast", params: { message: "Request submitted" } },
        ],
      },
    },
    confirmation: {
      type: "Text",
      props: { content: { $template: "Submitted: ${/lastSubmit/form/email}" }, muted: true },
      visible: { $state: "/lastSubmit" },
    },
  },
};

export const scenario: Scenario = {
  id: "form-submit",
  measures: "runtime",
  title: "Form blocks an invalid submit",
  controlPath: "Button.on.press → validateForm → submitForm (gated on /formValidation) → toast",
  page: "/orders",
  docs: "actions",
  opener: "Show the access request form",
  fixture: { spec, state: { form: { email: "", name: "" }, toast: "", lastSubmit: null } },
  script: [
    {
      press: "submit",
      expectState: {
        "/formValidation": {
          valid: false,
          errors: { "/form/email": ["Email is required", "Enter a valid email"], "/form/name": ["Name is required"] },
        },
        "/lastSubmit": null,
      },
      expectNoModelTurn: true,
    },
    { type: { path: "/form/email", value: "alex@acme.com" } },
    { type: { path: "/form/name", value: "Alex Kim" } },
    {
      press: "submit",
      expectState: {
        "/formValidation": { valid: true, errors: {} },
        "/lastSubmit/form": { email: "alex@acme.com", name: "Alex Kim" },
      },
      expectToast: "Request submitted",
      expectNoModelTurn: true,
    },
  ],
  bestPractice:
    "Pair validateForm with submitForm by letting submitForm read the validation result at the conventional /formValidation path and skip its write when valid is false, so pressing Submit on an empty required field cannot leave a truthy /lastSubmit for the host's onToolResult-style code to act on.",
};
