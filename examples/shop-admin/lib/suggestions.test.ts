import { describe, expect, test } from "bun:test";
import { matchesMockTurn } from "vexa/mock";
import { SCENARIOS } from "@/lib/scenarios";
import { mockTurnsOf } from "@/lib/scenarios/mock-prompts";
import { SUGGESTIONS } from "@/lib/suggestions";

describe("chat suggestions", () => {
  const turns = SCENARIOS.flatMap(mockTurnsOf);

  test("every suggestion has a mock turn, so the static build answers each chip", () => {
    const unanswered = SUGGESTIONS.filter(({ prompt }) => !turns.some((turn) => matchesMockTurn(turn, prompt))).map(({ prompt }) => prompt);
    expect(unanswered).toEqual([]);
  });
});
