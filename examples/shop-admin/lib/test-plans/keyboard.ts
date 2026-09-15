import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: { type: "Stack", props: { direction: "vertical", gap: "md" }, children: ["intake-form", "country-select"] },
    "intake-form": {
      type: "Form",
      props: {
        title: "Quick intake",
        submitLabel: "Submit",
        fields: [
          { label: "Name", name: "name", placeholder: "Alex Kim", inputType: "text" },
          { label: "Email", name: "email", placeholder: "you@company.com", inputType: "email" },
        ],
      },
    },
    "country-select": {
      type: "Select",
      props: {
        label: "Country",
        name: "country",
        placeholder: "Choose a country",
        options: [
          { value: "th", label: "Thailand" },
          { value: "sg", label: "Singapore" },
        ],
        value: null,
        disabled: false,
      },
    },
  },
};

export const scenario: Scenario = {
  id: "keyboard",
  title: "Tab order, Enter-to-submit, and Escape inside the overlay",
  controlPath: "fixture only — checked by hand with the chat overlay open",
  page: "/guides/keyboard",
  docs: "host/chat-elements",
  opener: "Show the keyboard test form",
  fixture: { spec },
  script: [],
  manualChecks: [
    "Tab from the first field to the last: focus visits Name, Email, Submit, then Country in the same order the spec lists them, never skipping or looping early.",
    "With focus in the Email field, press Enter: the Form submits the same as clicking Submit, with no page reload.",
    "Open the Country popover, then press Escape once: only the popover closes and focus returns to the Select trigger; the chat overlay stays open.",
    "With the popover already closed, press Escape again: now the chat overlay itself closes.",
  ],
  bestPractice:
    "Escape must be handled by the topmost layer only: a Select popover has to swallow the first Escape and return focus to its trigger, and only a second Escape with nothing else open should reach the overlay and close it.",
};
