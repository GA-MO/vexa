import Link from "next/link";
import { CatalogGallery } from "@/components/catalog-gallery";
import { CATALOG_TYPES } from "@/lib/catalog-gallery";

export const metadata = {
  title: "Catalog gallery · Agentic UI",
  description: "Every generative UI catalog type rendered as it appears in chat",
};

export default function CatalogPage() {
  return (
    <main className="relative min-h-dvh bg-[#F8FAFC] text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 size-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -right-16 top-32 size-[24rem] rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-indigo-600">Catalog gallery</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Every UI the chat can emit
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Review visual quality and spot missing catalog types before you
              wire more prompts. Currently{" "}
              <strong className="font-semibold text-slate-900">
                {CATALOG_TYPES.length} components
              </strong>
              .
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Host demo
            </Link>
            <Link
              href="/#chat"
              className="inline-flex h-9 items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-sm font-medium text-white shadow-[0_12px_28px_-14px_rgba(79,70,229,0.8)]"
            >
              Open chat
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/80" />

        <div className="mt-8">
          <CatalogGallery />
        </div>
      </div>
    </main>
  );
}
