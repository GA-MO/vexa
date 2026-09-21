import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VexaProvider } from "../react/host";
import { VexaChatOverlay } from "./overlay";

type Mounted = { root: Root; container: HTMLElement };

const mounted: Mounted[] = [];

async function mount(element: React.ReactNode): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  await act(async () => {
    await Promise.resolve();
  });
  mounted.push({ root, container });
  return container;
}

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
  window.name = "";
});

describe("VexaChatOverlay in the discovery frame", () => {
  test("renders the launcher in a normal window", async () => {
    const container = await mount(
      <VexaProvider admin={{ discover: "off" }}>
        <VexaChatOverlay />
      </VexaProvider>,
    );
    expect(container.querySelector('button[aria-expanded]')).not.toBeNull();
  });

  test("renders nothing inside the hidden discovery frame", async () => {
    window.name = "vexa-discover";
    const container = await mount(
      <VexaProvider admin>
        <VexaChatOverlay />
      </VexaProvider>,
    );
    expect(container.querySelector('button[aria-expanded]')).toBeNull();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
