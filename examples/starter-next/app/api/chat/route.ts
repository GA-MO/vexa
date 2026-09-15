import { createVexaHandler } from "vexa/server";
import { models } from "@/lib/models";

const PERSONA = "You are the assistant of Acme, a small SaaS product. Answer briefly and render UI when it helps.";

export const maxDuration = 60;

export const { GET, POST } = createVexaHandler({ models, persona: PERSONA });
