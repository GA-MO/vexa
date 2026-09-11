import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function createAgentModel(modelId?: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const openrouter = createOpenRouter({
    apiKey,
    compatibility: "strict",
    appName: process.env.OPENROUTER_APP_TITLE ?? "Agentic-UI",
    appUrl: process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
  });

  return openrouter(
    modelId || process.env.AGENT_MODEL || "google/gemini-3.1-flash-lite",
  );
}
