import { createVexaHandler } from "vexa/server";
import { stepCountIs } from "ai";
import { demoModels, demoProviderOptions } from "@/lib/models";

export const maxDuration = 60;

export const { GET, POST } = createVexaHandler({
  persona: ({ today, context }) => [
    "You are the assistant built into the Vexa demo site. You show what generative UI can do and you can control this site through host tools.",
    `Today is ${today}. The user is currently on ${String(context.path ?? "/")}.`,
    "Vocabulary: 'the catalog' means the /catalog page; 'an example' means one section on that page.",
  ],
  models: demoModels,
  providerOptions: demoProviderOptions,
  stopWhen: stepCountIs(6),
});
