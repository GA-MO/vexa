import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { createGetUrl, getSlugs } from "fumadocs-core/source";
import type { Plugin } from "vite";

export const EXAMPLE_PAGES_MODULE = "virtual:example-pages";
const RESOLVED_MODULE = `\0${EXAMPLE_PAGES_MODULE}`;
const DOCS_BASE_URL = "/docs";
const DOCS_CONTENT_DIR = "content/docs";
const EXAMPLE_TAG = /<Example\s+id="([^"]+)"/g;

const getDocsUrl = createGetUrl(DOCS_BASE_URL);

async function collectExamplePages(contentDir: string) {
  const pages: Record<string, string[]> = {};
  const entries = await Array.fromAsync(glob("**/*.mdx", { cwd: contentDir }));
  for (const entry of entries.sort()) {
    const body = await readFile(path.join(contentDir, entry), "utf8");
    const url = getDocsUrl(getSlugs(entry));
    for (const match of body.matchAll(EXAMPLE_TAG)) {
      const id = match[1];
      if (!id) continue;
      (pages[id] ??= []).push(url);
    }
  }
  return pages;
}

/** Exposes `virtual:example-pages`: which docs pages render each `<Example id />`, computed from content/docs at build time. */
export function examplePages(root: string): Plugin {
  const contentDir = path.join(root, DOCS_CONTENT_DIR);
  return {
    name: "vexa-example-pages",
    resolveId(id) {
      return id === EXAMPLE_PAGES_MODULE ? RESOLVED_MODULE : undefined;
    },
    async load(id) {
      if (id !== RESOLVED_MODULE) return undefined;
      return `export const EXAMPLE_PAGES = ${JSON.stringify(await collectExamplePages(contentDir))};`;
    },
  };
}
