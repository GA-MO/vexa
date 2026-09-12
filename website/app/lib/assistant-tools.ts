import { jsonSchema } from "ai";
import { useMemo } from "react";
import type { NavigateFunction } from "react-router";
import { defineTool, type HostTool, type HostToolResult } from "vexa/react";
import { EXAMPLE_PAGES } from "virtual:example-pages";

const ELEMENT_WAIT_MS = 4000;
const ELEMENT_POLL_MS = 100;
const HIGHLIGHT_MS = 2400;
const SCROLL_SETTLE_MS = 600;
const HIGHLIGHT_CLASSES = ["rounded-xl", "ring-2", "ring-primary/60", "ring-offset-4", "ring-offset-background"];
const NON_SLUG_CHARACTERS = /[^\p{L}\p{N}\s-]/gu;
const WHITESPACE = /\s+/g;

export const EXAMPLE_ATTRIBUTE = "data-example-id";

export function exampleElementId(id: string) {
  return `example-${id}`;
}

type StringFields<K extends string> = Record<K, string>;

function stringFields<K extends string>(fields: Record<K, string>) {
  const keys = Object.keys(fields) as K[];
  return jsonSchema<StringFields<K>>(
    {
      type: "object",
      properties: Object.fromEntries(keys.map((key) => [key, { type: "string", description: fields[key] }])),
      required: keys,
      additionalProperties: false,
    },
    {
      validate: (value) => {
        if (typeof value !== "object" || value === null) {
          return { success: false, error: new Error("Expected an object") };
        }
        const record = value as Record<string, unknown>;
        const missing = keys.find((key) => typeof record[key] !== "string" || record[key].length === 0);
        if (missing) return { success: false, error: new Error(`"${missing}" must be a non-empty string`) };
        return { success: true, value: record as StringFields<K> };
      },
    },
  );
}

function sameSiteUrl(url: string): URL | null {
  const parsed = new URL(url, window.location.origin);
  return parsed.origin === window.location.origin ? parsed : null;
}

function pathOf(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function pathWithHash(url: URL, hash: string) {
  return `${url.pathname}${url.search}#${hash}`;
}

function slugify(heading: string) {
  return heading.trim().toLowerCase().replace(NON_SLUG_CHARACTERS, "").replace(WHITESPACE, "-");
}

function waitFor(find: () => HTMLElement | null | undefined): Promise<HTMLElement | null> {
  const deadline = Date.now() + ELEMENT_WAIT_MS;
  return new Promise((resolve) => {
    const poll = () => {
      const element = find();
      if (element) return resolve(element);
      if (Date.now() > deadline) return resolve(null);
      window.setTimeout(poll, ELEMENT_POLL_MS);
    };
    poll();
  });
}

function findHeading(heading: string) {
  const byId = document.getElementById(slugify(heading)) ?? document.getElementById(heading);
  if (byId) return byId;
  const wanted = heading.trim().toLowerCase();
  return [...document.querySelectorAll<HTMLElement>("h2, h3, h4")].find(
    (element) => element.textContent?.trim().toLowerCase() === wanted,
  );
}

function findExample(id: string) {
  return document.getElementById(exampleElementId(id));
}

function highlight(element: HTMLElement) {
  element.classList.add(...HIGHLIGHT_CLASSES);
  window.setTimeout(() => element.classList.remove(...HIGHLIGHT_CLASSES), HIGHLIGHT_MS);
}

function reveal(element: HTMLElement) {
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "start" }), SCROLL_SETTLE_MS);
}

function goTo(navigate: NavigateFunction, path: string) {
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== path) navigate(path);
}

function compactSlug(value: string) {
  return value.toLowerCase().replace(/-/g, "");
}

function examplePageFor(id: string): string | null {
  const pages = EXAMPLE_PAGES[id];
  if (!pages || pages.length === 0) return null;
  const wanted = compactSlug(id);
  return (
    pages.find((page) => page === window.location.pathname) ??
    pages.find((page) => compactSlug(page.split("/").at(-1) ?? "") === wanted) ??
    pages[0] ??
    null
  );
}

function unknownExample(id: string): HostToolResult {
  return { ok: false, error: `Unknown example "${id}". Known ids: ${Object.keys(EXAMPLE_PAGES).sort().join(", ")}` };
}

export function createAssistantTools(navigate: NavigateFunction): Record<string, HostTool> {
  return {
    navigate: defineTool({
      description: "Open a page of this docs site by its path, for example /docs/host/host-tools.",
      input: stringFields({ url: "Site path starting with /, or a full URL on this site" }),
      run: ({ url }) => {
        const target = sameSiteUrl(url);
        if (!target) return { ok: false, error: `"${url}" is not a page on this site` };
        const path = pathOf(target);
        goTo(navigate, path);
        return { ok: true, summary: `Opened ${path}` };
      },
    }),
    open_section: defineTool({
      description: "Open a docs page and scroll to one of its headings, given the heading text or id.",
      input: stringFields({
        url: "Site path of the page, for example /docs/host/host-tools",
        heading: "Heading text or id on that page, for example 'Declare a tool'",
      }),
      run: async ({ url, heading }) => {
        const target = sameSiteUrl(url);
        if (!target) return { ok: false, error: `"${url}" is not a page on this site` };
        goTo(navigate, pathWithHash(target, slugify(heading)));
        const element = await waitFor(() => findHeading(heading));
        if (!element) return { ok: false, error: `No heading "${heading}" on ${target.pathname}` };
        reveal(element);
        return { ok: true, summary: `Showing "${element.textContent?.trim() ?? heading}" on ${target.pathname}` };
      },
    }),
    run_example: defineTool({
      description: "Open the docs page that renders a live example and scroll to it. id is an example id such as line-items or bar-chart.",
      input: stringFields({ id: "Example id from vexa/examples, for example line-items" }),
      run: async ({ id }) => {
        const page = examplePageFor(id);
        if (!page) return unknownExample(id);
        goTo(navigate, `${page}#${exampleElementId(id)}`);
        const element = await waitFor(() => findExample(id));
        if (!element) return { ok: false, error: `Example "${id}" did not render on ${page}` };
        reveal(element);
        highlight(element);
        return { ok: true, summary: `Showing example ${id} on ${page}` };
      },
    }),
  };
}

export function useAssistantTools(navigate: NavigateFunction) {
  return useMemo(() => createAssistantTools(navigate), [navigate]);
}
