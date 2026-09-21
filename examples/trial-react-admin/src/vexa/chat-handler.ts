import { createVexaHandler } from "vexa/server";
import { trialModels, trialProviderOptions } from "./models";

export function createTrialChatHandler() {
  return createVexaHandler({ models: trialModels(), admin: true, providerOptions: trialProviderOptions });
}
