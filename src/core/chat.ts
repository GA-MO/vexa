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

export async function streamAgentChat(
  messages: UIMessage[],
  options?: { model?: string },
) {
  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: createAgentModel(options?.model),
    system: buildAgentInstructions(),
    messages: modelMessages,
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(result.toUIMessageStream()));
    },
  });

  return createUIMessageStreamResponse({ stream });
}
