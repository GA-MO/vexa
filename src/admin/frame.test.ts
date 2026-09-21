import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createObservationCache } from "./cache";
import { createFrameHost, discoverInFrame, FRAME_NAME, isVexaFrame } from "./frame";

const originalError = console.error;

beforeEach(() => {
  console.error = () => undefined;
});

afterEach(() => {
  console.error = originalError;
  document.body.innerHTML = "";
  window.name = "";
});

describe("frame host", () => {
  test("open creates a hidden, inert, ignored iframe and reports a page that cannot load as unavailable", async () => {
    const reasons: string[] = [];
    const host = createFrameHost({ origin: "http://127.0.0.1:1", loadTimeoutMs: 300, onBlocked: (reason) => reasons.push(reason) });
    const result = await host.open("/orders");
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("name")).toBe(FRAME_NAME);
    expect(frame?.hasAttribute("data-vexa-ignore")).toBe(true);
    expect(frame?.getAttribute("aria-hidden")).toBe("true");
    expect(frame?.hasAttribute("inert")).toBe(true);
    expect(frame?.getAttribute("sandbox")).toContain("allow-same-origin");
    expect(frame?.getAttribute("style")).toContain("opacity:0");
    expect(frame?.getAttribute("style")).toContain("width:1280px");
    expect(frame?.getAttribute("style")).toContain("height:800px");
    expect(frame?.getAttribute("style")).not.toContain("display:none");
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBe("DISCOVERY_UNAVAILABLE");
    expect(reasons).toHaveLength(1);
    host.close();
    expect(document.querySelector("iframe")).toBeNull();
  });

  test("page and root are empty before anything is open", () => {
    const host = createFrameHost();
    expect(host.page()).toEqual({ path: "", title: "" });
    expect(host.root().childNodes.length).toBe(0);
  });

  test("discoverInFrame reports the blocked start page and leaves the cache untouched", async () => {
    const cache = createObservationCache();
    const frame = createFrameHost({ origin: "http://127.0.0.1:1", loadTimeoutMs: 300 });
    const result = await discoverInFrame({ frame, cache, startPath: "/settings" });
    expect(result.ok).toBe(false);
    expect(result.progress.status).toBe("failed");
    expect(result.progress.errors).toEqual([{ path: "/settings", error: "DISCOVERY_UNAVAILABLE" }]);
    expect(cache.observed()).toEqual([]);
    expect(document.querySelector("iframe")).toBeNull();
  });
});

describe("isVexaFrame", () => {
  test("is true only when the window is the discovery frame", () => {
    expect(isVexaFrame()).toBe(false);
    window.name = FRAME_NAME;
    expect(isVexaFrame()).toBe(true);
  });
});
