"use client";

import { SpecView } from "agentic-ui/react";
import {
  CATALOG_TYPES,
  COMPOSED_DASHBOARD_SPEC,
  GALLERY_SECTIONS,
  INTERACTIVE_SECTIONS,
} from "@/lib/catalog-gallery";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "agentic-ui/ai-elements/message";
import { ChatChromeSamples } from "@/components/chat-chrome-samples";

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function CatalogGallery() {
  return (
    <div className="space-y-16">
      <Section
        id="composed"
        title="Composed answer (as in chat)"
        eyebrow="End-to-end"
      >
        <p className="max-w-2xl text-sm text-slate-600">
          This is how a generative UI block looks inside an assistant turn —
          prose first, then a constrained spec.
        </p>
        <div className="rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-[0_24px_60px_-28px_rgba(79,70,229,0.35)] sm:p-5">
          <Message from="assistant">
            <MessageContent className="w-full max-w-none gap-3 bg-transparent px-0 py-0">
              <MessageResponse>
                นี่คือ dashboard สรุปยอดขายรายไตรมาส พร้อม metric และตารางเปรียบเทียบแผน
              </MessageResponse>
              <SpecView spec={COMPOSED_DASHBOARD_SPEC} />
            </MessageContent>
          </Message>
        </div>
      </Section>

      <Section id="chat-chrome" title="Chat chrome samples" eyebrow="Not catalog">
        <p className="max-w-2xl text-sm text-slate-600">
          Every AI Element used around specs in the overlay — not catalog types.
          Use this section for chat UX review.
        </p>
        <ChatChromeSamples />
      </Section>

      <Section id="interactive" title="Interactive runtime" eyebrow="State">
        <p className="max-w-2xl text-sm text-slate-600">
          Binding, visibility, repeat, watchers, validation, and computed /
          directives — open DevTools with{" "}
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px]">
            ⌘⇧J
          </kbd>{" "}
          to inspect Spec / State / Actions.
        </p>
        <div className="mt-6 space-y-10">
          {INTERACTIVE_SECTIONS.map((section) => (
            <article
              key={section.id}
              id={`interactive-${section.id}`}
              className="space-y-3"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500">{section.note}</p>
              </div>
              <SpecView showDevtools={false} spec={section.spec} />
            </article>
          ))}
        </div>
      </Section>

      <Section id="primitives" title="Catalog primitives" eyebrow="By type">
        <div className="flex flex-wrap gap-2">
          {CATALOG_TYPES.map((type) => (
            <a
              key={type}
              href={`#type-${type.toLowerCase()}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              {type}
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-10">
          {GALLERY_SECTIONS.map((section) => (
            <article
              key={section.id}
              id={`type-${section.component.split(",")[0].trim().toLowerCase()}`}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500">{section.note}</p>
                </div>
                <code className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                  {section.component}
                </code>
              </div>
              <SpecView spec={section.spec} />
            </article>
          ))}
        </div>
      </Section>

    </div>
  );
}
