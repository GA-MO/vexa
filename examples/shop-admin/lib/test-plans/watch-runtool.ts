import type { Spec } from "vexa/protocol";
import { CITIES, type City } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const BRANCHES_BY_CITY: Record<City, Array<{ value: string; label: string }>> = {
  Bangkok: [
    { value: "siam", label: "Siam branch" },
    { value: "asok", label: "Asok branch" },
  ],
  "Chiang Mai": [{ value: "nimman", label: "Nimman branch" }],
  Phuket: [{ value: "patong", label: "Patong branch" }],
  "Khon Kaen": [{ value: "downtown", label: "Downtown branch" }],
};

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Card",
      props: { title: "Pickup branch", description: "Picking a city loads its branches through watch → runTool, with no model turn." },
      children: ["city", "branch"],
    },
    city: {
      type: "Select",
      props: {
        label: "City",
        name: "city",
        placeholder: "Choose a city",
        options: CITIES.map((city) => ({ value: city, label: city })),
        value: { $bindState: "/form/city" },
        disabled: false,
      },
      watch: {
        "/form/city": [
          { action: "runTool", params: { name: "load_branches", input: { city: { $state: "/form/city" } } } },
        ],
      },
    },
    branch: {
      type: "Select",
      props: {
        label: "Branch",
        name: "branch",
        placeholder: "Choose a branch",
        options: { $state: "/tools/load_branches/branches" },
        value: { $bindState: "/form/branch" },
        disabled: false,
      },
    },
  },
};

export const scenario: Scenario = {
  id: "watch-runtool",
  measures: "runtime",
  title: "Select change cascades through watch",
  controlPath: "Select value change → watch → runTool load_branches → second Select bound to /tools/load_branches/branches",
  page: "/orders",
  docs: "host/runtool",
  opener: "Show the pickup branch picker",
  fixture: { spec, state: { form: { city: "", branch: "" } } },
  tools: {
    load_branches: (input) => {
      const city = typeof input.city === "string" ? (input.city as City) : undefined;
      const branches = city ? (BRANCHES_BY_CITY[city] ?? []) : [];
      return { ok: true, summary: `${branches.length} branch${branches.length === 1 ? "" : "es"} in ${city ?? "this city"}`, data: { branches } };
    },
  },
  script: [
    { type: { path: "/form/city", value: "Bangkok" } },
    { expectState: { "/tools/load_branches": { branches: BRANCHES_BY_CITY.Bangkok } } },
    { type: { path: "/form/city", value: "Phuket" } },
    { expectState: { "/tools/load_branches": { branches: BRANCHES_BY_CITY.Phuket } } },
  ],
  bestPractice:
    "Cascade a dependent Select with watch on the driving field's bound path (not on.press), so the second Select's options come from { $state: '/tools/<tool>/<field>' } and update the instant the first value changes, with no button and no model turn.",
};
