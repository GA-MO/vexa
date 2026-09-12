"use client";

import { useEffect, useMemo, useState } from "react";
import { SpecView } from "vexa/react";
import {
  CATALOG_TYPES,
  COMPOSED_EXAMPLES,
  GALLERY_SECTIONS,
  INTERACTIVE_SECTIONS,
  PRIMITIVE_GROUPS,
  type GallerySection,
} from "vexa/examples";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "vexa/ai-elements/message";
import { ChatChromeSamples } from "@/components/chat-chrome-samples";
import { cn } from "vexa/lib/utils";

type TabId = "composed" | "primitives" | "interactive" | "chrome";

const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "composed", label: "Composed", hint: "Answer shapes as they appear in chat" },
  { id: "primitives", label: "Primitives", hint: `${CATALOG_TYPES.length} catalog types` },
  { id: "interactive", label: "Interactive", hint: "Binding, visibility, repeat, watchers" },
  { id: "chrome", label: "Chat chrome", hint: "AI Elements around specs" },
];

function readHash(): { tab: TabId; item: string | null } {
  if (typeof window === "undefined") return { tab: "composed", item: null };
  const raw = window.location.hash.replace(/^#/, "");
  const [tab, item] = raw.split("/");
  const known = TABS.find((t) => t.id === tab);
  return { tab: known ? known.id : "composed", item: item ?? null };
}

function SideLink({
  active,
  href,
  children,
}: {
  active?: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "block truncate rounded-md border-l-2 px-2.5 py-1 text-[13px] transition",
        active
          ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
          : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900",
      )}
    >
      {children}
    </a>
  );
}

function ItemHeader({
  id,
  title,
  note,
  code,
}: {
  id: string;
  title: string;
  note: string;
  code?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          <a href={`#${id}`} className="hover:text-indigo-700">
            {title}
          </a>
        </h3>
        <p className="text-sm text-slate-500">{note}</p>
      </div>
      {code ? (
        <code className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
          {code}
        </code>
      ) : null}
    </div>
  );
}

function PrimitiveArticle({ section }: { section: GallerySection }) {
  return (
    <article id={`primitives/${section.id}`} className="scroll-mt-24 space-y-3">
      <ItemHeader
        id={`primitives/${section.id}`}
        title={section.title}
        note={section.note}
        code={section.component}
      />
      <SpecView showDevtools={false} spec={section.spec} />
    </article>
  );
}

export function CatalogGallery() {
  const [{ tab, item }, setHash] = useState<{ tab: TabId; item: string | null }>({
    tab: "composed",
    item: null,
  });

  useEffect(() => {
    const sync = () => setHash(readHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Scroll to the deep-linked item once the tab has rendered it.
  useEffect(() => {
    if (!item) return;
    const el = document.getElementById(`${tab}/${item}`);
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [tab, item]);

  // Scroll spy: highlight the sidebar entry for the article nearest the top.
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    setActive(item);
    const articles = Array.from(
      document.querySelectorAll<HTMLElement>(`article[id^="${tab}/"]`),
    );
    if (articles.length === 0) return;
    const pick = () => {
      const line = 120;
      let best: HTMLElement | null = null;
      for (const el of articles) {
        if (el.getBoundingClientRect().top - line <= 0) best = el;
        else break;
      }
      const target = best ?? articles[0];
      setActive(target.id.slice(tab.length + 1));
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [tab, item]);

  const sectionById = useMemo(
    () => new Map(GALLERY_SECTIONS.map((s) => [s.id, s] as const)),
    [],
  );
  const grouped = useMemo(
    () =>
      PRIMITIVE_GROUPS.map((g) => ({
        ...g,
        items: g.sections
          .map((id) => sectionById.get(id))
          .filter((s): s is GallerySection => Boolean(s)),
      })),
    [sectionById],
  );
  const ungrouped = useMemo(() => {
    const seen = new Set(PRIMITIVE_GROUPS.flatMap((g) => g.sections));
    return GALLERY_SECTIONS.filter((s) => !seen.has(s.id));
  }, []);

  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-8">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm transition",
                t.id === tab
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 font-medium text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)]"
                  : "text-slate-600 hover:bg-white hover:text-slate-900",
              )}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <div className="mt-4 hidden max-h-[calc(100dvh-9rem)] space-y-3 overflow-y-auto border-t border-slate-200/80 pt-4 pr-1 lg:block">
          {tab === "composed"
            ? COMPOSED_EXAMPLES.map((ex) => (
                <SideLink key={ex.id} href={`#composed/${ex.id}`} active={active === ex.id}>
                  {ex.title}
                </SideLink>
              ))
            : null}
          {tab === "interactive"
            ? INTERACTIVE_SECTIONS.map((sec) => (
                <SideLink key={sec.id} href={`#interactive/${sec.id}`} active={active === sec.id}>
                  {sec.title}
                </SideLink>
              ))
            : null}
          {tab === "primitives"
            ? grouped.map((g) => (
                <div key={g.id}>
                  <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {g.label}
                  </p>
                  {g.items.map((sec) => (
                    <SideLink key={sec.id} href={`#primitives/${sec.id}`} active={active === sec.id}>
                      {sec.title}
                    </SideLink>
                  ))}
                </div>
              ))
            : null}
        </div>
      </aside>

      {/* Content */}
      <div className="mt-6 min-w-0 lg:mt-0">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{current.label}</h2>
          <p className="text-sm text-slate-500">{current.hint}</p>
        </div>

        {tab === "composed" ? (
          <div className="space-y-10">
            {COMPOSED_EXAMPLES.map((ex) => (
              <article key={ex.id} id={`composed/${ex.id}`} className="scroll-mt-24 space-y-3">
                <ItemHeader id={`composed/${ex.id}`} title={ex.title} note={ex.note} />
                <div className="rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-[0_24px_60px_-28px_rgba(79,70,229,0.35)] sm:p-5">
                  <div className="space-y-4">
                    <Message from="user">
                      <MessageContent>{ex.prompt}</MessageContent>
                    </Message>
                    <Message from="assistant">
                      <MessageContent className="w-full max-w-none gap-3 bg-transparent px-0 py-0">
                        <MessageResponse>{ex.prose}</MessageResponse>
                        <SpecView showDevtools={false} spec={ex.spec} />
                      </MessageContent>
                    </Message>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {tab === "primitives" ? (
          <div className="space-y-12">
            {grouped.map((g) => (
              <section key={g.id} id={`primitives/group-${g.id}`} className="scroll-mt-24 space-y-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                    {g.label}
                  </h3>
                  <span className="h-px flex-1 bg-slate-200/80" />
                </div>
                {g.items.map((section) => (
                  <PrimitiveArticle key={section.id} section={section} />
                ))}
              </section>
            ))}
            {ungrouped.length > 0 ? (
              <section className="space-y-8">
                <h3 className="text-xs font-medium uppercase tracking-wide text-indigo-600">Other</h3>
                {ungrouped.map((section) => (
                  <PrimitiveArticle key={section.id} section={section} />
                ))}
              </section>
            ) : null}
          </div>
        ) : null}

        {tab === "interactive" ? (
          <div className="space-y-10">
            <p className="max-w-2xl text-sm text-slate-600">
              Binding, visibility, repeat, watchers, validation, and computed
              directives. Open DevTools with{" "}
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px]">
                ⌘⇧J
              </kbd>{" "}
              to inspect Spec / State / Actions.
            </p>
            {INTERACTIVE_SECTIONS.map((section) => (
              <article key={section.id} id={`interactive/${section.id}`} className="scroll-mt-24 space-y-3">
                <ItemHeader id={`interactive/${section.id}`} title={section.title} note={section.note} />
                <SpecView showDevtools={false} spec={section.spec} />
              </article>
            ))}
          </div>
        ) : null}

        {tab === "chrome" ? (
          <div className="space-y-4">
            <p className="max-w-2xl text-sm text-slate-600">
              Every AI Element used around specs in the overlay. Not catalog
              types; use this tab for chat UX review.
            </p>
            <ChatChromeSamples />
          </div>
        ) : null}
      </div>
    </div>
  );
}
