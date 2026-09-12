import Link from "next/link";
import { VexaChatOverlay } from "vexa/chat";

export default function Page() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#F8FAFC] text-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 size-[28rem] rounded-full bg-indigo-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 size-[26rem] rounded-full bg-violet-500/15 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-indigo-600">Host project preview</p>
          <Link
            href="/catalog"
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            Catalog gallery
          </Link>
        </div>
        <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Your app stays here.
          <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Vexa chat floats on top.
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
          Drop{" "}
          <code className="rounded-md bg-white px-1.5 py-0.5 text-sm text-indigo-700 shadow-sm ring-1 ring-slate-200">
            VexaChatOverlay
          </code>{" "}
          into any project. Review every generative UI type in the{" "}
          <Link href="/catalog" className="font-medium text-indigo-600 underline-offset-2 hover:underline">
            catalog gallery
          </Link>
          .
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Embeddable", "Fixed launcher + elevated panel"],
            ["Shared theme", "Indigo → violet tokens from DESIGN.md"],
            ["Catalog review", "Open /catalog to audit SpecView output"],
          ].map(([label, detail]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(79,70,229,0.45)] backdrop-blur"
            >
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="mt-1 text-sm text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="chat">
        <VexaChatOverlay defaultOpen={false} />
      </div>
    </main>
  );
}
