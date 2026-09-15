const FILES = [
  ["app/providers.tsx", "VexaProvider with the chat defaults, and the overlay"],
  ["app/api/chat/route.ts", "createVexaHandler: GET lists the models, POST streams the reply"],
  ["lib/models.ts", "the model registry: Claude when ANTHROPIC_API_KEY is set, the scripted mock always"],
  ["lib/mock.ts", "what the mock answers, so the app runs with no key"],
  ["app/globals.css", "Tailwind plus the Vexa token stylesheet"],
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Vexa starter for Next.js</h1>
      <p className="text-muted-foreground">
        One provider, one overlay, one API route. Press the launcher in the corner and send a suggestion; the mock model
        answers with text and generated UI until you add an API key.
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
  );
}
