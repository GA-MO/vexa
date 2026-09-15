import { VexaChatOverlay } from "vexa/chat";
import { VexaProvider } from "vexa/react";

const SUGGESTIONS = [
  { label: "What can you do?", prompt: "What can you do?" },
  { label: "Show me some UI", prompt: "Show me an example of the UI you can build" },
];

const FILES = [
  ["src/app.tsx", "VexaProvider with the chat defaults, the page, and the overlay"],
  ["server.ts", "createVexaHandler on Bun.serve: GET lists the models, POST streams the reply"],
  ["src/models.ts", "the model registry: Claude when ANTHROPIC_API_KEY is set, the scripted mock always"],
  ["src/mock.ts", "what the mock answers, so the app runs with no key"],
  ["vite.config.ts", "proxies /api to the server in development"],
] as const;

export function App() {
  return (
    <VexaProvider
      format={{ locale: "en-US", currency: "USD" }}
      chat={{ title: "Acme assistant", subtitle: "Ask anything about this app", suggestions: SUGGESTIONS }}
    >
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Vexa starter for Vite</h1>
        <p className="text-muted-foreground">
          One provider, one overlay, one fetch handler on a small server. Press the launcher in the corner and send a
          suggestion; the mock model answers with text and generated UI until you add an API key.
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {FILES.map(([file, purpose]) => (
            <li key={file} className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:gap-4">
              <code className="shrink-0 font-mono text-primary sm:w-48">{file}</code>
              <span className="text-muted-foreground">{purpose}</span>
            </li>
          ))}
        </ul>
      </main>
      <VexaChatOverlay />
    </VexaProvider>
  );
}
