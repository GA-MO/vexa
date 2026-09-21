import type { Scenario } from "@/lib/scenarios/types";

const PUBLISHED_REGISTRY = /"models":\[\{"id":"[^"]+".*"default":"[^"]+"/;

export const scenario: Scenario = {
  id: "registry",
  measures: "runtime",
  kind: "check",
  title: "Model picker list from GET, unknown id rejected with 400",
  controlPath: "GET /api/chat → model list; POST { model: \"nope\" } → 400 naming the id",
  page: "/settings",
  script: [
    { request: { method: "GET", path: "/api/chat" }, expectStatus: 200, expectBody: PUBLISHED_REGISTRY },
    {
      request: {
        method: "POST",
        path: "/api/chat",
        body: {
          id: "registry-scenario",
          trigger: "submit-message",
          messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] }],
          model: "nope",
        },
      },
      expectStatus: 400,
      expectBody: /nope/,
    },
  ],
  bestPractice:
    "Publish the model list from the same registry the server enforces (GET /api/chat), so the picker can never offer an id the POST handler will reject; a rejected id must be named back in the 400 body.",
};
