import { describe, expect, test } from "bun:test";
import { buildAgentInstructions, buildStandaloneAgentInstructions, type PromptToolInfo } from "./prompt";

const TOOLS: PromptToolInfo = { read: ["admin_observe"], write: ["admin_run"], destructive: [] };
const HOST_INSTRUCTION = "The shop sells phone cases.";
const DRIVING = "## Driving the page";
const WORKING = "## Working with tools";
const INVARIANTS = "## Non-negotiable rules";

describe("admin prompt section", () => {
  test("sits after the tool rules, before host instructions, with the invariants last", () => {
    const prompt = buildAgentInstructions({ admin: true, tools: TOOLS, instructions: [HOST_INSTRUCTION] });
    const working = prompt.indexOf(WORKING);
    const driving = prompt.indexOf(DRIVING);
    const host = prompt.indexOf(HOST_INSTRUCTION);
    const invariants = prompt.indexOf(INVARIANTS);
    expect(working).toBeGreaterThan(-1);
    expect(driving).toBeGreaterThan(working);
    expect(host).toBeGreaterThan(driving);
    expect(invariants).toBeGreaterThan(host);
    expect(prompt.lastIndexOf("## ")).toBe(invariants);
  });

  test("tells the model about observed pages, routes and cross-page plans", () => {
    const prompt = buildAgentInstructions({ admin: true, tools: TOOLS });
    expect(prompt).toContain("every result also lists routes and observed");
    expect(prompt).toContain("Put every step of one task in one call");
    expect(prompt).toContain("refs work on the page they came from, elsewhere use role and name");
    expect(prompt).toContain("admin_discover looks through the app's pages in a hidden frame without moving the user");
  });

  test("tells the model to answer with UI for data requests and drive the page only for actions", () => {
    const prompt = buildAgentInstructions({ admin: true, tools: TOOLS });
    expect(prompt).toContain("Answer with UI when the user asks to see, list, compare or summarise data");
    expect(prompt).toContain("Drive the page only when the user asks to open, change, fill, create or delete something");
    expect(prompt.split("\n").filter((line) => line.startsWith("- ") && prompt.indexOf(line) > prompt.indexOf(DRIVING) && prompt.indexOf(line) < prompt.indexOf(INVARIANTS)).length).toBeGreaterThanOrEqual(5);
  });

  test("keeps admin_run out of the approval card list: the page's own dialog is the approval", () => {
    const prompt = buildAgentInstructions({ admin: true, tools: { ...TOOLS, write: ["admin_run", "update_status"] } });
    expect(prompt).toContain("approval card before they run: update_status.");
    expect(prompt).not.toContain("approval card before they run: admin_run");
    expect(prompt).toContain("Forms and buttons run without asking");
    expect(prompt).toContain('stopped: "confirmation"');
    expect(prompt).toContain("never press its buttons");
  });

  test("is absent without admin and in standalone mode", () => {
    expect(buildAgentInstructions({ tools: TOOLS })).not.toContain(DRIVING);
    expect(buildStandaloneAgentInstructions({ admin: true, tools: TOOLS })).not.toContain(DRIVING);
  });
});
