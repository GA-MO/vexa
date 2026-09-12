import { Link } from "react-router";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Coming soon
      </p>
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-prose text-muted-foreground">{description}</p>
      <Link to="/docs/get-started" className="text-sm font-medium text-primary hover:underline">
        Read Get started in the meantime
      </Link>
    </section>
  );
}
