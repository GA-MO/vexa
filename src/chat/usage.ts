import type { LanguageModelUsage } from "ai";
import type { VexaMessage } from "vexa/protocol";

export function estimateTokens(messages: VexaMessage[]) {
  let chars = 0;
  for (const message of messages) {
    for (const part of message.parts) {
      if ("text" in part && typeof part.text === "string") {
        chars += part.text.length;
      }
    }
  }
  return Math.max(1, Math.ceil(chars / 4));
}

export function estimateUsage(messages: VexaMessage[]): LanguageModelUsage {
  const total = estimateTokens(messages);
  const inputTokens = Math.ceil(total * 0.7);
  const outputTokens = Math.max(0, total - inputTokens);
  return {
    inputTokens,
    outputTokens,
    totalTokens: total,
    inputTokenDetails: {
      noCacheTokens: inputTokens,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    outputTokenDetails: {
      textTokens: outputTokens,
      reasoningTokens: 0,
    },
  };
}
