function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

/** The `data` object of a tool result as the mock model sees it, so a scripted reply can quote real values. */
export function toolData(output: unknown): Record<string, unknown> {
  return asRecord(asRecord(output).data);
}

export function toolDataNumber(output: unknown, key: string): number {
  const value = toolData(output)[key];
  return typeof value === "number" ? value : 0;
}

function contentText(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const texts = value.map(asRecord).flatMap((part) => (typeof part.text === "string" ? [part.text] : []));
  return texts.length > 0 ? texts.join("\n") : null;
}

/** The human-readable text of a tool result: a plain string, MCP `content` parts, or the JSON of anything else. */
export function toolOutputText(output: unknown): string {
  if (typeof output === "string") return output;
  const record = asRecord(output);
  return contentText(record.content) ?? contentText(toolData(output).content) ?? JSON.stringify(output);
}

export function toolDataRows(output: unknown, key: string): Record<string, unknown>[] {
  const value = toolData(output)[key];
  return Array.isArray(value) ? value.map(asRecord) : [];
}
