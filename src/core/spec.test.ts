import { describe, expect, test } from "bun:test";
import type { Spec } from "../protocol";
import { catalog } from "./catalog";
import { normalizeSpec } from "./spec";

const METRIC = { type: "Metric", props: { label: "Orders", value: "24" } } as never;

describe("normalizeSpec", () => {
  test("fills missing props and children so the catalog accepts the element", () => {
    const spec = { root: "m", elements: { m: { type: "Metric", props: { label: "Orders", value: "24" } }, s: { type: "Separator" } } } as unknown as Spec;
    const normalized = normalizeSpec(spec);
    expect(normalized.elements.m.children).toEqual([]);
    expect(normalized.elements.s.props).toEqual({});
    expect(normalized.elements.s.children).toEqual([]);
    expect(catalog.validate(normalized).success).toBe(true);
    expect(catalog.validate(spec).success).toBe(false);
  });

  test("leaves present keys and everything else untouched", () => {
    const spec = { root: "s", elements: { s: { type: "Stack", props: { gap: "md" }, children: ["m"], visible: { $state: "/x" } }, m: METRIC } } as unknown as Spec;
    const normalized = normalizeSpec(spec);
    expect(normalized.elements.s).toEqual(spec.elements.s);
    expect(Object.keys(normalized.elements.m).sort()).toEqual(["children", "props", "type"]);
    expect(normalized).not.toBe(spec);
    expect(spec.elements.m).not.toHaveProperty("children");
  });

  test("passes through empty and malformed input", () => {
    expect(normalizeSpec(null)).toBeNull();
    expect(normalizeSpec(undefined)).toBeUndefined();
    const broken = { root: "a", elements: { a: "nope" } } as unknown as Spec;
    expect(normalizeSpec(broken).elements.a).toBe("nope" as never);
  });
});
