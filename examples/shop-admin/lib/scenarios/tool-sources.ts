import { readFile } from "node:fs/promises";
import path from "node:path";

export type ToolSource = { file: string; code: string };

const SOURCE_FILES = ["lib/shop/host-tools.ts", "components/demo-host.tsx", "lib/shop/server-tools.ts"] as const;

function readSource(file: string): Promise<string> {
  return readFile(path.join(process.cwd(), file), "utf8");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Slices the `name: …` entry of an object literal: from its first line to the closing `}` or `})` at the same indent. */
function sliceEntry(source: string, name: string): string | null {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^\\s+${escapeRegExp(name)}: `).test(line));
  if (start === -1) return null;
  const indent = lines[start].match(/^\s*/)?.[0] ?? "";
  const closing = new RegExp(`^${indent}\\}\\)?,?$`);
  const end = lines.findIndex((line, index) => index > start && closing.test(line));
  if (end === -1) return null;
  return lines
    .slice(start, end + 1)
    .map((line) => line.slice(indent.length))
    .join("\n");
}

/** The source of every definition of a tool across the host tool definitions, the app's defineTool wiring, and the server tools. */
export async function toolSources(name: string): Promise<ToolSource[]> {
  const sources = await Promise.all(
    SOURCE_FILES.map(async (file) => {
      const code = sliceEntry(await readSource(file), name);
      return code ? [{ file: `examples/shop-admin/${file}`, code }] : [];
    }),
  );
  return sources.flat();
}
