import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CHAT_ELEMENT_EXAMPLES } from "../examples/chat-elements";
import { AssistantMessage } from "./messages";

const mounted: Array<{ root: Root; container: HTMLElement }> = [];

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

async function renderExample(id: string) {
  const example = CHAT_ELEMENT_EXAMPLES.find((item) => item.id === id);
  if (!example) throw new Error(`no chat element example ${id}`);
  const reply = example.messages.find((message) => message.role === "assistant");
  if (!reply) throw new Error(`example ${id} has no assistant message`);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AssistantMessage message={reply} messages={example.messages} isLast isStreaming={false} />);
  });
  mounted.push({ root, container });
  return container;
}

describe("admin_run trace", () => {
  test("renders one sentence per step and the error on the failed one", async () => {
    const container = await renderExample("admin-run");
    const stepsToggle = Array.from(container.querySelectorAll("button")).find((button) => /steps?$/.test(button.textContent ?? ""));
    if (stepsToggle) await act(async () => stepsToggle.click());
    const toolToggle = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("admin_run"));
    if (toolToggle) await act(async () => toolToggle.click());
    const rows = Array.from(container.querySelectorAll("li")).map((row) => row.textContent ?? "");
    expect(rows.some((row) => row.startsWith("Open /orders"))).toBe(true);
    expect(rows.some((row) => row.startsWith('Fill Search orders with "C-1042"'))).toBe(true);
    const failed = rows.find((row) => row.startsWith("Select shipped in Status"));
    expect(failed).toContain("TARGET_NOT_FOUND: no combobox named Status");
  });
});
