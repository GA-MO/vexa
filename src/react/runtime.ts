"use client";

import type { ComputedFunction } from "@json-render/core";
import type { StateStore } from "@json-render/react";
import { standardDirectives } from "@json-render/directives";
import type { HostToolResult, VexaHostValue } from "./host";
import { createFormatter, type Formatter } from "./format";

export const RUNTIME_NAMESPACES = ["/tools", "/host"] as const;
export const ACTION_MESSAGE_PREFIX = "⟦action⟧";

export const vexaDirectives = standardDirectives;

export function createVexaFunctions(formatter: Formatter, extra: Record<string, ComputedFunction> = {}): Record<string, ComputedFunction> {
  return {
    fullName: (args) =>
      `${String(args.first ?? "")} ${String(args.last ?? "")}`.trim(),
    formatCurrency: (args) => {
      const value = Number(args.value ?? 0);
      const currency = typeof args.currency === "string" ? args.currency : formatter.format.currency;
      return new Intl.NumberFormat(formatter.format.locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    },
    ...extra,
  };
}

export const vexaFunctions = createVexaFunctions(createFormatter());

export function isRuntimePath(path: string) {
  return RUNTIME_NAMESPACES.some(
    (namespace) => path === namespace || path.startsWith(`${namespace}/`),
  );
}

export function isValidStatePath(path: string) {
  if (!path.startsWith("/") || path.length > 200) return false;
  const segments = path.split("/").slice(1);
  return segments.every((segment) => segment.length > 0 && segment !== "..");
}

/** Wraps a store so specs cannot write into runtime-owned namespaces (/tools, /host). */
export function createGuardedStore(store: StateStore): StateStore {
  const rejectRuntimeWrite = (path: string) => {
    console.warn(`Vexa: "${path}" is runtime-owned and cannot be written from a spec`);
  };
  return {
    ...store,
    set: (path, value) => {
      if (isRuntimePath(path) || !isValidStatePath(path)) return rejectRuntimeWrite(path);
      store.set(path, value);
    },
    update: (updates) => {
      const allowed: Record<string, unknown> = {};
      for (const [path, value] of Object.entries(updates)) {
        if (isRuntimePath(path) || !isValidStatePath(path)) rejectRuntimeWrite(path);
        else allowed[path] = value;
      }
      store.update(allowed);
    },
  };
}

export function formatActionMessage(name: string, input: unknown) {
  return `${ACTION_MESSAGE_PREFIX} runTool ${name} ${JSON.stringify(input ?? {})}`;
}

function readToolParams(params: Record<string, unknown>) {
  const name = typeof params.name === "string" ? params.name : "";
  const input =
    typeof params.input === "object" && params.input !== null ? params.input : {};
  return { name, input };
}

function recordToolResult(store: StateStore, name: string, result: HostToolResult) {
  store.set(`/tools/${name}`, result.ok ? (result.data ?? { ok: true, summary: result.summary }) : result);
  if (!result.ok) store.set("/toast", result.error);
  else if (result.summary) store.set("/toast", result.summary);
}

/** Handlers closed over a SpecView store (path-style set). */
export function createVexaHandlers(store: StateStore, host: VexaHostValue | null) {
  return {
    submitForm: async (params: Record<string, unknown>) => {
      const path =
        typeof params.statePath === "string" && params.statePath.length > 0
          ? params.statePath
          : "/lastSubmit";
      const form = store.get("/form") ?? store.get("/ui/form");
      store.set(path, { form, at: new Date().toISOString() });
    },
    toast: async (params: Record<string, unknown>) => {
      store.set("/toast", String(params.message ?? ""));
    },
    runTool: async (params: Record<string, unknown>) => {
      const { name, input } = readToolParams(params);
      if (!name) return;
      if (!host) {
        store.set("/toast", `No VexaProvider is mounted, cannot run "${name}"`);
        return;
      }
      if (host.hasTool(name)) {
        const result = await host.runTool(name, input, { toolCallId: null, source: "button" });
        recordToolResult(store, name, result);
        return;
      }
      const sent = host.sendToChat(formatActionMessage(name, input));
      if (!sent) store.set("/toast", `No chat is open to forward "${name}"`);
    },
  };
}
