import { describe, expect, test } from "bun:test";
import { handlePagesWrite, pagesFileWritable, type PagesFs } from "./pages-file";
import type { AdminPagesFile } from "../admin/seed";

const FILE: AdminPagesFile = {
  version: 1,
  pages: [{ path: "/orders", title: "Orders", elements: [{ ref: "l1", role: "link", name: "Home", href: "/" }], unnamed: 0 }],
  links: [{ href: "/", name: "Home" }],
};

function fakeFs(existing: string | null = null): PagesFs & { writes: Array<{ path: string; text: string }> } {
  const writes: Array<{ path: string; text: string }> = [];
  return {
    writes,
    resolve: (path) => `/app/${path}`,
    readFile: async () => existing,
    writeFile: async (path, text) => {
      writes.push({ path, text });
    },
  };
}

const PAGES_FILE = "vexa-pages.json";
const BODY = { kind: "pages", file: FILE };

describe("handlePagesWrite", () => {
  test("writes a new file and reports the resolved count", async () => {
    const fs = fakeFs();
    const response = await handlePagesWrite(PAGES_FILE, BODY, fs, "development");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ written: true, path: PAGES_FILE, pages: 1 });
    expect(fs.writes).toHaveLength(1);
    expect(fs.writes[0].path).toBe("/app/vexa-pages.json");
    expect(fs.writes[0].text.endsWith("\n")).toBe(true);
    expect(JSON.parse(fs.writes[0].text)).toEqual(FILE);
  });

  test("skips the write when the file on disk is structurally equal", async () => {
    const reordered = { ...FILE, links: [...FILE.links].reverse() };
    const fs = fakeFs(JSON.stringify(reordered));
    const response = await handlePagesWrite(PAGES_FILE, BODY, fs, "development");
    expect(await response.json()).toEqual({ written: false, path: PAGES_FILE, pages: 1 });
    expect(fs.writes).toHaveLength(0);
  });

  test("rewrites a corrupt or different file", async () => {
    const fs = fakeFs("{ not json");
    await handlePagesWrite(PAGES_FILE, BODY, fs, "development");
    expect(fs.writes).toHaveLength(1);
  });

  test("rejects an invalid body or file", async () => {
    const fs = fakeFs();
    expect((await handlePagesWrite(PAGES_FILE, { kind: "other" }, fs, "development")).status).toBe(400);
    expect((await handlePagesWrite(PAGES_FILE, { kind: "pages", file: { version: 2 } }, fs, "development")).status).toBe(400);
    expect(fs.writes).toHaveLength(0);
  });

  test("rejects an oversized file", async () => {
    const fs = fakeFs();
    const huge = { kind: "pages", file: { ...FILE, links: [{ href: "/", name: "x".repeat(2 * 1024 * 1024) }] } };
    expect((await handlePagesWrite(PAGES_FILE, huge, fs, "development")).status).toBe(413);
  });

  test("answers 404 in production or without a configured file", async () => {
    const fs = fakeFs();
    expect((await handlePagesWrite(PAGES_FILE, BODY, fs, "production")).status).toBe(404);
    expect((await handlePagesWrite(undefined, BODY, fs, "development")).status).toBe(404);
    expect(fs.writes).toHaveLength(0);
  });
});

describe("pagesFileWritable", () => {
  test("needs a file and a non-production environment", () => {
    expect(pagesFileWritable("x.json", "development")).toBe(true);
    expect(pagesFileWritable("x.json", undefined)).toBe(true);
    expect(pagesFileWritable("x.json", "production")).toBe(false);
    expect(pagesFileWritable(undefined, "development")).toBe(false);
  });
});
