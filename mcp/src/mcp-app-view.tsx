import { useEffect, useState } from "react";
import type { Spec } from "@json-render/core";
import { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { SpecView } from "agentic-ui/react";

function isSpec(value: unknown): value is Spec {
  return (
    !!value &&
    typeof value === "object" &&
    "root" in value &&
    "elements" in value
  );
}

function parseSpecFromToolResult(result: {
  content?: Array<{ type: string; text?: string }>;
}): Spec | null {
  const text = result.content?.find((part) => part.type === "text")?.text;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (isSpec(parsed)) return parsed;
    if (
      parsed &&
      typeof parsed === "object" &&
      "spec" in parsed &&
      isSpec((parsed as { spec: unknown }).spec)
    ) {
      return (parsed as { spec: Spec }).spec;
    }
  } catch {
    return null;
  }
  return null;
}

export function McpAppView() {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let received = false;

    function accept(next: Spec) {
      if (received) return;
      received = true;
      setSpec(next);
      setLoading(false);
    }

    function onMessage(event: MessageEvent) {
      const data = event.data as Record<string, unknown> | undefined;
      if (!data || typeof data !== "object") return;
      const method = data.method as string | undefined;
      const params = data.params as Record<string, unknown> | undefined;

      if (method === "ui/notifications/tool-input" && params?.arguments) {
        const args = params.arguments as Record<string, unknown>;
        if (isSpec(args.spec)) accept(args.spec);
      }
    }

    window.addEventListener("message", onMessage);

    const app = new McpApp({ name: "Agentic UI", version: "0.1.0" });
    app.ontoolresult = (result) => {
      const parsed = parseSpecFromToolResult(
        result as { content?: Array<{ type: string; text?: string }> },
      );
      if (parsed) accept(parsed);
    };
    app.onerror = (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    };

    void app.connect().then(() => {
      if (!received) setLoading(false);
    });

    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (error) {
    return (
      <div className="p-4 text-sm text-rose-600">MCP app error: {error}</div>
    );
  }

  if (!spec) {
    return (
      <div className="flex min-h-40 items-center justify-center p-6 text-sm text-slate-500">
        {loading ? "Connecting..." : "Waiting for a generated UI spec..."}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8FAFC] p-4">
      <SpecView spec={spec} />
    </div>
  );
}
