"use client";

import { useEffect, useMemo, useState } from "react";
import type { Spec } from "vexa/protocol";
import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { catalog } from "vexa/core";
import {
  createStateStore,
  JSONUIProvider,
  Renderer,
} from "@json-render/react";
import { JsonRenderDevtools } from "@json-render/devtools-react";
import type { ComponentRegistry } from "@json-render/react";
import { registry } from "./registry";
import { useVexaHostContext } from "./host";
import {
  createGuardedStore,
  createVexaFunctions,
  createVexaHandlers,
  vexaDirectives,
} from "./runtime";
import { createFormatter } from "./format";

const isDev = process.env.NODE_ENV !== "production";

export function SpecView({
  spec,
  loading = false,
  messages,
  showDevtools = isDev,
  components,
}: {
  spec: Spec | null;
  loading?: boolean;
  messages?: UIMessage[];
  showDevtools?: boolean;
  components?: ComponentRegistry;
}) {
  if (!spec) return null;

  return (
    <SpecViewInner
      key={
        typeof spec.root === "string"
          ? spec.root
          : JSON.stringify(spec.root ?? "spec")
      }
      components={components}
      loading={loading}
      messages={messages}
      showDevtools={showDevtools}
      spec={spec}
    />
  );
}

function isHostToolResult(value: unknown): value is { ok: boolean; data?: unknown; summary?: string; error?: string } {
  return typeof value === "object" && value !== null && typeof (value as { ok?: unknown }).ok === "boolean";
}

/** Host tools answer `{ ok, data, summary }`, so a spec binds to their `data`. A server tool's own shape is kept whole. */
function storedToolValue(output: unknown) {
  if (!isHostToolResult(output)) return output;
  if (!output.ok) return output;
  return "data" in output ? output.data : output;
}

/** `/tools/<name>` is the latest call up to this message; `/tools/<name>.1`, `.2`, ... are the calls of that tool within one turn, so two cards in one turn can bind to different results. */
function completedToolOutputs(messages: UIMessage[] | undefined) {
  const outputs: Record<string, unknown> = {};
  for (const message of messages ?? []) {
    const seen = new Map<string, number>();
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") continue;
      const name = getToolName(part);
      const value = storedToolValue(part.output);
      const index = (seen.get(name) ?? 0) + 1;
      seen.set(name, index);
      outputs[`/tools/${name}`] = value;
      outputs[`/tools/${name}.${index}`] = value;
    }
  }
  return outputs;
}

function SpecViewInner({
  spec,
  loading,
  messages,
  showDevtools,
  components,
}: {
  spec: Spec;
  loading: boolean;
  messages?: UIMessage[];
  showDevtools: boolean;
  components?: ComponentRegistry;
}) {
  const host = useVexaHostContext();
  const initialState =
    "state" in spec && spec.state && typeof spec.state === "object"
      ? (spec.state as Record<string, unknown>)
      : {};

  const [store] = useState(() => createStateStore(initialState));
  const guardedStore = useMemo(() => createGuardedStore(store), [store]);
  const handlers = useMemo(() => createVexaHandlers(store, host), [store, host]);
  const functions = useMemo(
    () => createVexaFunctions(host?.formatter ?? createFormatter(), host?.functions),
    [host],
  );
  const toolOutputs = useMemo(() => completedToolOutputs(messages), [messages]);
  const normalize = host?.normalizeSpec ?? null;
  const shown = useMemo(() => (normalize ? normalize(spec, { toolOutputs }) : spec), [normalize, spec, toolOutputs]);
  const hostComponents = components ?? host?.components;
  const specRegistry = useMemo(
    () => (hostComponents && Object.keys(hostComponents).length > 0 ? { ...registry, ...hostComponents } : registry),
    [hostComponents],
  );

  useEffect(() => {
    if (!host) return;
    let active = true;
    void host.readContext().then((context) => {
      if (active) store.set("/host", context);
    });
    return () => {
      active = false;
    };
  }, [host, store]);

  useEffect(() => {
    if (Object.keys(toolOutputs).length === 0) return;
    store.update(toolOutputs);
  }, [store, toolOutputs]);

  return (
    <JSONUIProvider
      registry={specRegistry}
      store={guardedStore}
      handlers={handlers}
      functions={functions}
      directives={vexaDirectives}
    >
      <div className="@container/vexa w-full min-w-0">
        <Renderer spec={shown} registry={specRegistry} loading={loading} />
      </div>
      {showDevtools ? (
        <JsonRenderDevtools
          catalog={catalog}
          messages={messages}
          spec={shown}
        />
      ) : null}
    </JSONUIProvider>
  );
}
