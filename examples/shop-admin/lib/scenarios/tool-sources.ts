import { readFile } from "node:fs/promises";
import path from "node:path";
import { isAdminToolName } from "vexa/admin";

export type ToolSource = { file: string; code: string };

const SOURCE_FILES = ["lib/shop/host-tools.ts", "components/demo-host.tsx", "lib/shop/server-tools.ts"] as const;
const PROVIDER_FILE = "components/demo-host.tsx";
const HANDLER_FILE = "lib/shop/chat-handler.ts";

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
  if (isAdminToolName(name)) return adminToolSources();
  const sources = await Promise.all(
    SOURCE_FILES.map(async (file) => {
      const code = sliceEntry(await readSource(file), name);
      return code ? [{ file: `examples/shop-admin/${file}`, code }] : [];
    }),
  );
  return sources.flat();
}

/** The opening `<VexaProvider …>` tag, where the admin prop lives. */
function sliceProviderTag(source: string): string | null {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trimStart().startsWith("<VexaProvider"));
  if (start === -1) return null;
  const indent = lines[start].match(/^\s*/)?.[0] ?? "";
  const end = lines.findIndex((line, index) => index > start && line === `${indent}>`);
  if (end === -1) return null;
  return lines
    .slice(start, end + 1)
    .map((line) => line.slice(indent.length))
    .join("\n");
}

function sliceLine(source: string, needle: string): string | null {
  const line = source.split("\n").find((candidate) => candidate.includes(needle));
  return line ? line.trim() : null;
}

/** Admin tools come from the library; the app only turns them on, so show the provider tag and the handler line that do. */
async function adminToolSources(): Promise<ToolSource[]> {
  const [provider, handler] = await Promise.all([readSource(PROVIDER_FILE), readSource(HANDLER_FILE)]);
  const adminOptions = sliceLine(provider, "const admin = ");
  const tag = sliceProviderTag(provider);
  const optIn = sliceLine(handler, "admin: true");
  const providerCode = [adminOptions, tag].filter((part): part is string => part !== null).join("\n\n");
  return [
    ...(providerCode ? [{ file: `examples/shop-admin/${PROVIDER_FILE}`, code: providerCode }] : []),
    ...(optIn ? [{ file: `examples/shop-admin/${HANDLER_FILE}`, code: optIn }] : []),
  ];
}
