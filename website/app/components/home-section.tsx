import type { ReactNode } from "react";

export function HomeSection({
  id,
  eyebrow,
  title,
  lede,
  children,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`w-full min-w-0 px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex max-w-2xl flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">{lede}</p>
        </header>
        {children}
      </div>
    </section>
  );
}
