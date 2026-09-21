import type { Spec } from "vexa/protocol";
import type { Scenario } from "@/lib/scenarios/types";

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "Guest details", description: "Every field below is bound under /ui" },
      children: ["name-input", "agree-checkbox", "notify-switch", "plan-radio", "country-select", "confirmation-slot"],
    },
    "name-input": {
      type: "Input",
      props: {
        label: "Name",
        name: "name",
        placeholder: "Your name",
        inputType: "text",
        value: { $bindState: "/ui/name" },
        checks: null,
        validateOn: null,
      },
    },
    "agree-checkbox": {
      type: "Checkbox",
      props: { label: "I agree to the terms", name: "agree", hint: null, checked: { $bindState: "/ui/agree" }, disabled: false },
    },
    "notify-switch": {
      type: "Switch",
      props: { label: "Email updates", name: "notify", hint: null, checked: { $bindState: "/ui/notify" }, disabled: false },
    },
    "plan-radio": {
      type: "RadioGroup",
      props: {
        label: "Plan",
        name: "plan",
        options: [
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro" },
        ],
        value: { $bindState: "/ui/plan" },
        disabled: false,
      },
    },
    "country-select": {
      type: "Select",
      props: {
        label: "Country",
        name: "country",
        placeholder: null,
        options: [
          { value: "th", label: "Thailand" },
          { value: "sg", label: "Singapore" },
        ],
        value: { $bindState: "/ui/country" },
        disabled: false,
      },
    },
    "confirmation-slot": { type: "Text", props: { content: "Fill in the form above.", muted: true } },
  },
};

const MODEL_DEFAULTS = { name: "Alex", agree: true, notify: false, plan: "free", country: "th" };
const TYPED_VALUES = { name: "Nam Srisuk", agree: false, notify: true, plan: "pro", country: "sg" };

export const scenario: Scenario = {
  id: "bound-inputs",
  measures: "runtime",
  title: "Typed values survive a spec patch",
  controlPath: "model-sent /ui/* defaults → user types/toggles/picks → data-spec patch → /ui/* unchanged",
  page: "/guides/bound-inputs",
  docs: "state",
  opener: "Show the preferences form",
  fixture: { spec, state: { ui: MODEL_DEFAULTS, tools: { seed: "read-only" }, host: { seed: "read-only" } } },
  script: [
    {
      expectState: {
        "/ui/name": MODEL_DEFAULTS.name,
        "/ui/agree": MODEL_DEFAULTS.agree,
        "/ui/notify": MODEL_DEFAULTS.notify,
        "/ui/plan": MODEL_DEFAULTS.plan,
        "/ui/country": MODEL_DEFAULTS.country,
      },
    },
    { type: { path: "/ui/name", value: TYPED_VALUES.name } },
    { type: { path: "/ui/agree", value: TYPED_VALUES.agree } },
    { type: { path: "/ui/notify", value: TYPED_VALUES.notify } },
    { type: { path: "/ui/plan", value: TYPED_VALUES.plan } },
    { type: { path: "/ui/country", value: TYPED_VALUES.country } },
    {
      expectState: {
        "/ui/name": TYPED_VALUES.name,
        "/ui/agree": TYPED_VALUES.agree,
        "/ui/notify": TYPED_VALUES.notify,
        "/ui/plan": TYPED_VALUES.plan,
        "/ui/country": TYPED_VALUES.country,
      },
    },
    {
      patch: [
        { op: "add", path: "/elements/confirmation", value: { type: "Text", props: { content: "Thanks, we saved your answers.", muted: false } } },
        { op: "add", path: "/elements/root/children/-", value: "confirmation" },
      ],
    },
    { expectSpec: { confirmation: { exists: true }, "confirmation-slot": { exists: true } } },
    {
      expectState: {
        "/ui/name": TYPED_VALUES.name,
        "/ui/agree": TYPED_VALUES.agree,
        "/ui/notify": TYPED_VALUES.notify,
        "/ui/plan": TYPED_VALUES.plan,
        "/ui/country": TYPED_VALUES.country,
      },
    },
    { type: { path: "/tools/hack", value: "should be dropped" } },
    { type: { path: "/host/hack", value: "should be dropped" } },
    { expectState: { "/tools/hack": undefined, "/host/hack": undefined, "/tools/seed": "read-only", "/host/seed": "read-only" } },
  ],
  bestPractice:
    "A data-spec patch only adds or replaces elements — it never touches /ui/*, so bound Input/Checkbox/Switch/RadioGroup/Select values survive any later UI patch as long as the model reuses the same bound paths instead of new ones.",
};
