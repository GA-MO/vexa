import { streamAgentChat } from "agentic-ui/core";
import type { UIMessage } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const messages: UIMessage[] = body.messages;
  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : undefined;

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  try {
    return await streamAgentChat(messages, { model });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to stream chat";
    return Response.json({ error: message }, { status: 500 });
  }
}
