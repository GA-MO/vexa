"use client";

import { VexaChatOverlay } from "vexa/chat";
import { VexaProvider } from "vexa/react";

const SUGGESTIONS = [
  { label: "What can you do?", prompt: "What can you do?" },
  { label: "Show me some UI", prompt: "Show me an example of the UI you can build" },
];

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VexaProvider
      format={{ locale: "en-US", currency: "USD" }}
      chat={{ title: "Acme assistant", subtitle: "Ask anything about this app", suggestions: SUGGESTIONS }}
    >
      {children}
      <VexaChatOverlay />
    </VexaProvider>
  );
}
