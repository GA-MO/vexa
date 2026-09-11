import { pipeJsonRender } from "@json-render/core";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { buildAgentInstructions } from "./prompt";
import { createAgentModel } from "./openrouter";

function openRouterReasoningOptions(modelId?: string) {
  const id = modelId || process.env.AGENT_MODEL || "";
  const supportsThinking =
    /gemini-2\.5|gemini-3|claude|o1|o3|o4|deepseek-r1|:thinking|gpt-5/i.test(
      id,
    );
  if (!supportsThinking) return undefined;
  return {
    reasoning: {
      effort: "medium" as const,
    },
  };
}

export async function streamAgentChat(
  messages: UIMessage[],
  options?: { model?: string },
) {
  const modelId = options?.model;
  const modelMessages = await convertToModelMessages(messages);
  const openrouter = openRouterReasoningOptions(modelId);
  const result = streamText({
    model: createAgentModel(modelId),
    system: buildAgentInstructions(),
    messages: modelMessages,
    ...(openrouter
      ? { providerOptions: { openrouter } }
      : {}),
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(
        pipeJsonRender(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        ),
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
