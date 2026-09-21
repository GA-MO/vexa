import { z } from "zod";
import type { CachedPage, LinkRef, ObservationCache } from "./cache";
import type { Snapshot, SnapshotElement } from "./snapshot";

export const ADMIN_PAGES_VERSION = 1;
export const MAX_PAGES_FILE_BYTES = 2 * 1024 * 1024;
const JSON_INDENT = 2;

const snapshotElementSchema = z
  .object({
    ref: z.string(),
    role: z.string(),
    name: z.string().optional(),
    within: z.string().optional(),
    href: z.string().optional(),
    value: z.string().optional(),
    options: z.array(z.string()).optional(),
    checked: z.boolean().optional(),
    pressed: z.boolean().optional(),
    expanded: z.boolean().optional(),
    selected: z.boolean().optional(),
    disabled: z.boolean().optional(),
    sensitive: z.boolean().optional(),
    columns: z.array(z.string()).optional(),
    rows: z.number().int().nonnegative().optional(),
  })
  .strict();

const pageRecordSchema = z
  .object({
    path: z.string().min(1),
    title: z.string(),
    elements: z.array(snapshotElementSchema),
    unnamed: z.number().int().nonnegative(),
    truncated: z.boolean().optional(),
  })
  .strict();

const linkRefSchema = z.object({ href: z.string(), name: z.string() }).strict();

export const adminPagesSchema = z
  .object({
    version: z.literal(ADMIN_PAGES_VERSION),
    pages: z.array(pageRecordSchema),
    links: z.array(linkRefSchema),
  })
  .strict();

/** The pages file: every observed page and link, structure only, no timestamps, sorted, so the same UI always serialises to the same bytes. */
export type AdminPagesFile = { version: typeof ADMIN_PAGES_VERSION; pages: Snapshot[]; links: LinkRef[] };

export type AdminPages = AdminPagesFile;

export type ImportPagesResult = { ok: true; pages: number } | { ok: false; error: string };

function byPath(a: Snapshot, b: Snapshot) {
  return a.path.localeCompare(b.path);
}

function byHref(a: LinkRef, b: LinkRef) {
  return a.href.localeCompare(b.href) || a.name.localeCompare(b.name);
}

const STRUCTURAL_KEYS = ["ref", "role", "name", "within", "href", "options", "sensitive", "columns"] as const satisfies ReadonlyArray<keyof SnapshotElement>;

function structuralElement(element: SnapshotElement): SnapshotElement {
  const record = {} as Record<string, unknown>;
  for (const key of STRUCTURAL_KEYS) if (element[key] !== undefined) record[key] = element[key];
  return record as SnapshotElement;
}

function pageStructure(page: CachedPage): Snapshot {
  const record: Snapshot = { path: page.path, title: page.title, elements: page.elements.map(structuralElement), unnamed: page.unnamed };
  if (page.truncated) record.truncated = true;
  return record;
}

export function toPagesFile(cache: ObservationCache): AdminPagesFile {
  return {
    version: ADMIN_PAGES_VERSION,
    pages: cache.entries().map(pageStructure).sort(byPath),
    links: [...cache.links()].sort(byHref),
  };
}

export function fromPagesFile(file: AdminPagesFile, observedAt: number): CachedPage[] {
  return file.pages.map((page) => ({ ...page, observedAt }));
}

function canonical(file: AdminPagesFile): string {
  return JSON.stringify({ pages: [...file.pages].sort(byPath), links: [...file.links].sort(byHref) });
}

export function pagesFileEquals(a: AdminPagesFile, b: AdminPagesFile): boolean {
  return canonical(a) === canonical(b);
}

export function serializePagesFile(file: AdminPagesFile): string {
  return `${JSON.stringify(file, null, JSON_INDENT)}\n`;
}

export function exportPages(cache: ObservationCache): AdminPagesFile {
  return toPagesFile(cache);
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export type ParsePagesFileResult = { ok: true; file: AdminPagesFile } | { ok: false; error: string };

export function parsePagesFile(data: unknown): ParsePagesFileResult {
  if (JSON.stringify(data ?? null).length > MAX_PAGES_FILE_BYTES) return { ok: false, error: "invalid pages file: larger than 2 MB" };
  const parsed = adminPagesSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: `invalid pages file: ${firstIssue(parsed.error)}` };
  return { ok: true, file: parsed.data };
}

/** Adds the file's pages to the cache as observed at `observedAt`; a page the cache already holds from a later time keeps its live copy. */
export function importPages(cache: ObservationCache, data: unknown, observedAt = Date.now()): ImportPagesResult {
  const parsed = parsePagesFile(data);
  if (!parsed.ok) return parsed;
  let restored = 0;
  for (const page of fromPagesFile(parsed.file, observedAt)) {
    if (cache.restore(page, parsed.file.links)) restored += 1;
  }
  return { ok: true, pages: restored };
}
