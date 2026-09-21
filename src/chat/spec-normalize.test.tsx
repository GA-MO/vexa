import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { VexaMessage } from "vexa/protocol";
import { evaluateSpec } from "vexa/eval";
import { AssistantMessage } from "./messages";

const mounted: Array<{ root: Root; container: HTMLElement }> = [];

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

const SPEC_WITHOUT_CHILDREN = {
  root: "grid",
  elements: {
    grid: { type: "Grid", props: { columns: 2 }, children: ["orders", "revenue"] },
    orders: { type: "Metric", props: { label: "Orders", value: "24" } },
    revenue: { type: "Metric", props: { label: "Revenue", value: "$1,240" } },
  },
};

const messages: VexaMessage[] = [
  { id: "u", role: "user", parts: [{ type: "text", text: "Give me a dashboard" }] },
  { id: "a", role: "assistant", parts: [{ type: "text", text: "Here it is." }, { type: "data-spec", data: { type: "flat", spec: SPEC_WITHOUT_CHILDREN } }] },
] as VexaMessage[];

describe("specs that leave out children", () => {
  test("evaluate as ok after normalization", () => {
    expect(evaluateSpec(SPEC_WITHOUT_CHILDREN as never).ok).toBe(true);
  });

  test("render their metrics in the chat without a console error", async () => {
    const errors: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => errors.push(args.map(String).join(" "));
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(<AssistantMessage message={messages[1]} messages={messages} isLast isStreaming={false} />);
      });
    } finally {
      console.error = original;
    }
    mounted.push({ root, container });
    expect(container.textContent).toContain("Orders");
    expect(container.textContent).toContain("$1,240");
    expect(errors.filter((line) => !/act\(/.test(line))).toEqual([]);
  });
});
