export const ACTION_MESSAGE_PREFIX = "⟦action⟧";

const ACTION_SHAPE = /^⟦action⟧ runTool (\S+) (\{.*\})$/s;

export type ForwardedAction = { name: string; input: Record<string, unknown> };

/** The literal message runTool forwards to the chat when a button names a tool the client has no implementation for. */
export function forwardedActionText(name: string, input: unknown): string {
  return `${ACTION_MESSAGE_PREFIX} runTool ${name} ${JSON.stringify(input ?? {})}`;
}

export function parseForwardedAction(text: string): ForwardedAction | null {
  const match = ACTION_SHAPE.exec(text.trim());
  if (!match) return null;
  try {
    const input = JSON.parse(match[2]) as unknown;
    if (typeof input !== "object" || input === null) return null;
    return { name: match[1], input: input as Record<string, unknown> };
  } catch {
    return null;
  }
}

/** How a guide names a prompt: typed text as is, a forwarded button press as "Button press: <tool> <input>". */
export function describePrompt(text: string): string {
  const action = parseForwardedAction(text);
  return action ? `Button press: ${action.name} ${JSON.stringify(action.input)}` : text;
}

export function isForwardedActionFor(name: string): (prompt: string) => boolean {
  return (prompt) => parseForwardedAction(prompt)?.name === name;
}
