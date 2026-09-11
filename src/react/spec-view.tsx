"use client";

import { useMemo, useState } from "react";
import type { Spec } from "agentic-ui/protocol";
import type { UIMessage } from "ai";
import { catalog } from "agentic-ui/core";
import {
  createStateStore,
  JSONUIProvider,
  Renderer,
} from "@json-render/react";
import { JsonRenderDevtools } from "@json-render/devtools-react";
import { registry } from "./registry";
import {
  agenticDirectives,
  agenticFunctions,
  createAgenticHandlers,
} from "./runtime";

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
  const initialState =
    "state" in spec && spec.state && typeof spec.state === "object"
      ? (spec.state as Record<string, unknown>)
      : {};

  const [store] = useState(() => createStateStore(initialState));
  const handlers = useMemo(() => createAgenticHandlers(store), [store]);

  return (
    <JSONUIProvider
      registry={registry}
      store={store}
      handlers={handlers}
      functions={agenticFunctions}
      directives={agenticDirectives}
    >
      <div className="@container/agentic w-full min-w-0">
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
