import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { VexaMessage } from "vexa/protocol";
import { AssistantMessage } from "./messages";

const mounted: Array<{ root: Root; container: HTMLElement }> = [];

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

function boundSpec(path: string) {
  return { root: "total", elements: { total: { type: "Metric", props: { label: "Orders", value: { $state: path } }, children: [] } } };
}

function countCall(id: string, total: string) {
  return { type: "tool-count_orders", toolCallId: id, state: "output-available", input: {}, output: { total } };
}

const messages: VexaMessage[] = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "How many orders?" }] },
  { id: "a1", role: "assistant", parts: [countCall("c1", "24 orders"), { type: "data-spec", data: { type: "flat", spec: boundSpec("/tools/count_orders/total") } }] },
  { id: "u2", role: "user", parts: [{ type: "text", text: "And this week, and today?" }] },
  {
    id: "a2",
    role: "assistant",
    parts: [countCall("c2", "99 orders"), countCall("c3", "7 orders"), { type: "data-spec", data: { type: "flat", spec: boundSpec("/tools/count_orders.1/total") } }],
  },
] as VexaMessage[];

async function renderMessage(message: VexaMessage): Promise<string> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AssistantMessage message={message} messages={messages} isLast={false} isStreaming={false} />);
  });
  mounted.push({ root, container });
  return container.textContent ?? "";
}

describe("a spec binds to tool results of its own turn", () => {
  test("an earlier card keeps its own result after a later turn calls the same tool", async () => {
    const text = await renderMessage(messages[1]);
    expect(text).toContain("24 orders");
    expect(text).not.toContain("99 orders");
  });

  test("a numbered path counts the calls within the turn, not the whole chat", async () => {
    const text = await renderMessage(messages[3]);
    expect(text).toContain("99 orders");
  });
});
