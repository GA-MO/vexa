import { Layers, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { HomeSection } from "@/components/home-section";

type ValuePoint = {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

const VALUE_POINTS: ValuePoint[] = [
  {
    icon: Layers,
    title: "Constrained, not free-form",
    body: "The model never writes HTML, CSS, or JSX. It composes components from a catalog defined once; the same object generates the prompt and maps to the renderer, so the prompt cannot drift from what renders.",
    href: "/docs/concepts/catalog",
    linkLabel: "Read about the catalog",
  },
  {
    icon: Wrench,
    title: "Host tools and MCP",
    body: "Register a browser capability once on VexaProvider and both the model (by tool call) and buttons in generated UI (by runTool) can invoke it. Server tools and allow-listed MCP servers carry tiers and approval gates.",
    href: "/docs/concepts/host-tools",
    linkLabel: "Read about host tools",
  },
  {
    icon: ShieldCheck,
    title: "Secure by construction",
    body: "The server is the trust boundary. Tool outputs are fenced as data, injection is detected and contained per turn, specs cannot forge tool results, and the library invariants are always the last block of the prompt.",
    href: "/docs/security",
    linkLabel: "Read the security model",
  },
];

function ValueCard({ point }: { point: ValuePoint }) {
  const Icon = point.icon;
  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-brand-violet text-primary-foreground shadow-md shadow-primary/30">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
        {point.title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{point.body}</p>
      <Link
        to={point.href}
        className="mt-auto inline-flex min-h-9 items-center text-sm font-medium text-primary hover:underline"
      >
        {point.linkLabel}
      </Link>
    </article>
  );
}

export function HomeValueStrip() {
  return (
    <HomeSection
      id="why"
      eyebrow="Why Vexa"
      title="Generative UI with the guardrails already on"
      lede="Every reply is text plus a spec built from your catalog. The host owns the components, the tools, and the trust boundary."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_POINTS.map((point) => (
          <ValueCard key={point.title} point={point} />
        ))}
      </div>
    </HomeSection>
  );
}
