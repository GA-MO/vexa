import { ArrowRight } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { CATALOG_TYPES } from "vexa/examples";
import { HeroDemoFallback } from "@/components/hero-demo-fallback";

const HeroDemo = lazy(() =>
  import("@/components/hero-demo").then((module) => ({ default: module.HeroDemo })),
);

const HERO_FACTS = [
  { value: String(CATALOG_TYPES.length), label: "catalog components" },
  { value: "3", label: "spec actions" },
  { value: "0", label: "model calls on this page" },
];

function GradientBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-10 size-[28rem] animate-hero-drift rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute -right-24 top-40 size-[30rem] animate-hero-drift-slow rounded-full bg-brand-violet/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-[22rem] animate-hero-drift rounded-full bg-info/15 blur-3xl [animation-delay:-6s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,var(--background)_95%)]" />
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-xl">
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
        <span className="size-1.5 animate-hero-pulse rounded-full bg-success" />
        Generative UI for React, constrained to a catalog
      </p>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Your assistant answers with{" "}
        <span className="bg-gradient-to-r from-primary via-brand-violet to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-hero-shimmer">
          real components
        </span>
      </h1>
      <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
        Vexa is a chat overlay for any React app. The model replies with text plus a spec that
        streams patch by patch and renders from the components you ship. No HTML, no JSX, nothing
        outside the catalog.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/docs/get-started"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-brand-violet px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
        >
          Get started
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          to="/playground"
          className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground shadow-md shadow-primary/10 transition hover:border-primary/50 hover:text-primary"
        >
          Open the playground
        </Link>
        <Link
          to="/docs/examples"
          className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground shadow-md shadow-primary/10 transition hover:border-primary/50 hover:text-primary"
        >
          See the examples
        </Link>
      </div>
      <dl className="flex flex-wrap gap-x-8 gap-y-3">
        {HERO_FACTS.map((fact) => (
          <div key={fact.label} className="flex flex-col">
            <dt className="order-2 text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="order-1 font-display text-2xl font-semibold tracking-tight text-foreground">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative w-full min-w-0 overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
      <GradientBlobs />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
        <HeroCopy />
        <div className="w-full min-w-0">
          <Suspense fallback={<HeroDemoFallback />}>
            <HeroDemo />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
