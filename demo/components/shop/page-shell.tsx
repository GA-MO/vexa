import type { ReactNode } from "react";

export function PageShell({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}

export function Panel({ id, title, children }: { id?: string; title?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-16 flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : null}
      {children}
    </section>
  );
}
