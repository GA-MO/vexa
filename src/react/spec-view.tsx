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
}: {
  spec: Spec | null;
  loading?: boolean;
  messages?: UIMessage[];
  showDevtools?: boolean;
}) {
  if (!spec) return null;

  return (
    <SpecViewInner
      key={
        typeof spec.root === "string"
          ? spec.root
          : JSON.stringify(spec.root ?? "spec")
      }
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

function storedToolValue(output: unknown) {
  if (!isHostToolResult(output)) return output;
  if (!output.ok) return output;
  return output.data ?? { ok: true, summary: output.summary };
}

function completedToolOutputs(messages: UIMessage[] | undefined) {
  const outputs: Record<string, unknown> = {};
  for (const message of messages ?? []) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") continue;
      outputs[`/tools/${getToolName(part)}`] = storedToolValue(part.output);
    }
  }
  return outputs;
}

function SpecViewInner({
  spec,
  loading,
  messages,
  showDevtools,
}: {
  spec: Spec;
  loading: boolean;
  messages?: UIMessage[];
  showDevtools: boolean;
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
      registry={registry}
      store={guardedStore}
      handlers={handlers}
      functions={functions}
      directives={vexaDirectives}
    >
      <div className="@container/vexa w-full min-w-0">
        <Renderer spec={spec} registry={registry} loading={loading} />
      </div>
      {showDevtools ? (
        <JsonRenderDevtools
          catalog={catalog}
          messages={messages}
          spec={spec}
        />
      ) : null}
    </JSONUIProvider>
  );
}
