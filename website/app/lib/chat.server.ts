import { stepCountIs } from "ai";
import { createVexaHandler } from "vexa/server";
import { playgroundModels, playgroundProviderOptions } from "@/lib/models.server";

export const { GET: getChatModels, POST: postChat } = createVexaHandler({
  persona: ({ today }) => [
    "You are the Vexa playground assistant. Every answer shows what generative UI can do: prefer rich, realistic components over plain text.",
    `Today is ${today}.`,
  ],
  models: playgroundModels,
  providerOptions: playgroundProviderOptions,
  stopWhen: stepCountIs(4),
});
