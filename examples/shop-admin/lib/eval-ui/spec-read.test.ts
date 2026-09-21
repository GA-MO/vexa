import { describe, expect, test } from "bun:test";
import type { Spec } from "vexa/protocol";
import { chartSeries, specText, tableRows } from "./spec-read";

const ROWS = [
  { id: "C-1042", customer: "Napat Srisuwan", total: 2070 },
  { id: "C-1039", customer: "Kanya Thongdee", total: 1160 },
];

function specWith(elements: Spec["elements"], state?: Record<string, unknown>): Spec {
  return { root: Object.keys(elements)[0], elements, state } as Spec;
}

describe("tableRows", () => {
  test("reads literal rows", () => {
    const spec = specWith({ table: { type: "Table", props: { columns: [], rows: ROWS }, children: [] } });
    expect(tableRows(spec)).toEqual([["C-1042", "Napat Srisuwan", 2070], ["C-1039", "Kanya Thongdee", 1160]]);
  });

  test("resolves rows bound with $state against the spec state", () => {
    const spec = specWith({ table: { type: "Table", props: { columns: [], rows: { $state: "/orders" } }, children: [] } }, { orders: ROWS });
    expect(tableRows(spec)).toHaveLength(2);
    expect(specText(spec)).toContain("C-1039");
  });

  test("counts the items of a repeat over state as listed records", () => {
    const spec = specWith(
      {
        list: { type: "Stack", props: {}, children: ["card"], repeat: { statePath: "/orders", key: "id" } },
        card: { type: "Card", props: { title: { $template: "${id}" } }, children: [] },
      } as never,
      { orders: ROWS },
    );
    expect(tableRows(spec).map((row) => row[0])).toEqual(["C-1042", "C-1039"]);
  });

  test("returns no rows when the bound path is missing", () => {
    const spec = specWith({ table: { type: "Table", props: { columns: [], rows: { $state: "/missing" } }, children: [] } }, { orders: ROWS });
    expect(tableRows(spec)).toEqual([]);
  });
});

describe("chartSeries", () => {
  test("resolves bound labels and series", () => {
    const spec = specWith(
      { chart: { type: "BarChart", props: { labels: { $state: "/cities" }, series: { $state: "/series" } }, children: [] } },
      { cities: ["Bangkok", "Phuket"], series: [{ name: "Orders", values: [7, 5] }] },
    );
    expect(chartSeries(spec)).toEqual([{ labels: ["Bangkok", "Phuket"], values: [7, 5] }]);
  });
});
