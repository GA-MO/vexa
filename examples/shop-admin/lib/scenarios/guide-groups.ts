import type { Scenario } from "./types";

export type GuideGroup = { title: string; ids: string[] };

export const GUIDE_GROUPS: GuideGroup[] = [
  { title: "Move the user around", ids: ["navigate", "deep-link", "page-state"] },
  { title: "Read the page", ids: ["context", "input-to-model"] },
  {
    title: "Let generated UI act",
    ids: ["button-runtool", "watch-runtool", "server-runtool", "form-submit", "bound-inputs", "patch-after-input", "conditional-ui", "validation", "multi-step"],
  },
  { title: "Ask before acting", ids: ["approval", "denial-semantics", "host-to-chat"] },
  { title: "Bring data", ids: ["server-tools", "mcp-stdio"] },
  { title: "Stay safe", ids: ["injection"] },
  { title: "Look right", ids: ["chat-elements", "narrow-panel", "theme-format", "keyboard"] },
];

const UNGROUPED_TITLE = "Other";

export function isGuide(scenario: Scenario): boolean {
  return scenario.kind !== "check";
}

/** Guide scenarios in the order of GUIDE_GROUPS; any guide missing from the map lands in a trailing "Other" group so it is never hidden. */
export function groupedGuides(scenarios: Scenario[]): Array<{ title: string; scenarios: Scenario[] }> {
  const guides = scenarios.filter(isGuide);
  const byId = new Map(guides.map((scenario) => [scenario.id, scenario]));
  const placed = new Set<string>();
  const groups = GUIDE_GROUPS.map((group) => ({
    title: group.title,
    scenarios: group.ids.flatMap((id) => {
      const scenario = byId.get(id);
      if (!scenario) return [];
      placed.add(id);
      return [scenario];
    }),
  })).filter((group) => group.scenarios.length > 0);
  const leftover = guides.filter((scenario) => !placed.has(scenario.id));
  if (leftover.length > 0) groups.push({ title: UNGROUPED_TITLE, scenarios: leftover });
  return groups;
}
