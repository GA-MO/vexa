import { ExternalLink } from "lucide-react";
import { exampleAppUrl, type ExampleApp } from "@/lib/example-urls";

type ExampleAppLinkProps = { app: ExampleApp; path?: string; label: string; note?: string };

/** A prominent link into a running example app: the hosted build on the published site, the dev server locally. */
export function ExampleAppLink({ app, path = "/", label, note }: ExampleAppLinkProps) {
  const href = exampleAppUrl(app, path);
  return (
    <a
      href={href}
      className="not-prose my-4 flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 no-underline transition-colors hover:bg-primary/10"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{label}</span>
        {note ? <span className="text-xs text-muted-foreground">{note}</span> : <span className="text-xs text-muted-foreground">{href}</span>}
      </span>
      <ExternalLink className="size-4 shrink-0 text-primary" aria-hidden />
    </a>
  );
}
