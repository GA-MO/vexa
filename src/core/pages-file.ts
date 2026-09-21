import { z } from "zod";
import { MAX_PAGES_FILE_BYTES, pagesFileEquals, parsePagesFile, serializePagesFile, type AdminPagesFile } from "../admin/seed";

export type PagesFs = {
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, text: string): Promise<void>;
  resolve(path: string): string;
};

export type PagesWriteResult = { written: boolean; path: string; pages: number };

const pagesWriteBody = z.object({ kind: z.literal("pages"), file: z.unknown() }).strict();

const PRODUCTION = "production";

function isProduction(env: string | undefined) {
  return env === PRODUCTION;
}

function runtimeEnv(): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
}

/** True when a `pagesFile` is configured and this is not a production build; the only case in which PUT writes anything. */
export function pagesFileWritable(pagesFile: string | undefined, env = runtimeEnv()): boolean {
  return Boolean(pagesFile) && !isProduction(env);
}

async function currentFile(fs: PagesFs, path: string): Promise<AdminPagesFile | null> {
  const text = await fs.readFile(path);
  if (text === null) return null;
  try {
    const parsed = parsePagesFile(JSON.parse(text));
    return parsed.ok ? parsed.file : null;
  } catch {
    return null;
  }
}

export type PagesSource = AdminPagesFile | null | (() => AdminPagesFile | null | Promise<AdminPagesFile | null>);

async function fromSource(source: PagesSource | undefined): Promise<AdminPagesFile | null> {
  if (!source) return null;
  try {
    const value = typeof source === "function" ? await source() : source;
    if (!value) return null;
    const parsed = parsePagesFile(value);
    return parsed.ok ? parsed.file : null;
  } catch {
    return null;
  }
}

/** Reads the pages served by GET: `pages` when configured, else the `pagesFile` on disk; production reads the file once and keeps it. */
export function createPagesReader(pagesFile: string | undefined, source: PagesSource | undefined, loadFs: () => Promise<PagesFs | null>, env = runtimeEnv()) {
  let cached: Promise<AdminPagesFile | null> | null = null;
  const read = async (): Promise<AdminPagesFile | null> => {
    const configured = await fromSource(source);
    if (configured) return configured;
    if (!pagesFile) return null;
    const fs = await loadFs();
    return fs ? currentFile(fs, fs.resolve(pagesFile)) : null;
  };
  return () => {
    if (!isProduction(env)) return read();
    cached ??= read();
    return cached;
  };
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Validates a `{ kind: "pages", file }` body and writes the file only when it differs from what is on disk; 404 unless writable. */
export async function handlePagesWrite(pagesFile: string | undefined, body: unknown, fs: PagesFs, env = runtimeEnv()): Promise<Response> {
  if (!pagesFileWritable(pagesFile, env) || !pagesFile) return jsonError("Not found", 404);
  const parsedBody = pagesWriteBody.safeParse(body);
  if (!parsedBody.success) return jsonError("Body must be { kind: \"pages\", file }", 400);
  if (JSON.stringify(parsedBody.data.file ?? null).length > MAX_PAGES_FILE_BYTES) return jsonError("Pages file larger than 2 MB", 413);
  const parsed = parsePagesFile(parsedBody.data.file);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const path = fs.resolve(pagesFile);
  const existing = await currentFile(fs, path);
  const result: PagesWriteResult = { written: false, path: pagesFile, pages: parsed.file.pages.length };
  if (existing && pagesFileEquals(existing, parsed.file)) return Response.json(result);
  await fs.writeFile(path, serializePagesFile(parsed.file));
  return Response.json({ ...result, written: true });
}

type NodeFsModule = { readFile(path: string, encoding: "utf8"): Promise<string>; writeFile(path: string, text: string): Promise<void> };
type NodePathModule = { resolve(...parts: string[]): string };

function hasNodeRuntime(): boolean {
  const versions = (globalThis as { process?: { versions?: Record<string, string | undefined> } }).process?.versions;
  return typeof versions?.node === "string" || typeof versions?.bun === "string";
}

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "ENOENT";
}

/** The Node filesystem for `pagesFile`, or null in a browser bundle (the static examples run the handler in the page). */
export async function nodePagesFs(): Promise<PagesFs | null> {
  if (!hasNodeRuntime()) return null;
  try {
    const fs = (await import("fs/promises")) as NodeFsModule;
    const path = (await import("path")) as NodePathModule;
    if (typeof fs.readFile !== "function" || typeof path.resolve !== "function") return null;
    const cwd = (globalThis as { process?: { cwd?: () => string } }).process?.cwd?.() ?? "";
    return {
      resolve: (file) => path.resolve(cwd, file),
      readFile: async (file) => {
        try {
          return await fs.readFile(file, "utf8");
        } catch (error) {
          if (isMissingFile(error)) return null;
          throw error;
        }
      },
      writeFile: (file, text) => fs.writeFile(file, text),
    };
  } catch {
    return null;
  }
}
