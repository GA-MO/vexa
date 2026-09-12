import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { Spec } from "vexa/protocol";
import { SpecView } from "vexa/react";
import {
  COMPOSED_EXAMPLES,
  GALLERY_SECTIONS,
  INTERACTIVE_SECTIONS,
  type ComposedExample,
  type GallerySection,
  type InteractiveSection,
} from "vexa/examples";
import { ChatWidthFrame } from "@/components/chat-width-frame";
import { EXAMPLE_ATTRIBUTE, exampleElementId } from "@/lib/assistant-tools";
import { CodeSurface } from "@/components/code-surface";
import { specStreamText } from "@/lib/spec-stream";

const TAB_LABELS = ["Preview", "Spec", "JSONL"];

type Conversation = { prompt: string; prose: string };

type ExampleEntry = {
  id: string;
  note: string;
  spec: Spec;
  conversation: Conversation | null;
};

function toEntry(section: GallerySection | InteractiveSection): ExampleEntry {
  return { id: section.id, note: section.note, spec: section.spec, conversation: null };
}

function toConversationEntry(example: ComposedExample): ExampleEntry {
  return {
    id: example.id,
    note: example.note,
    spec: example.spec,
    conversation: { prompt: example.prompt, prose: example.prose },
  };
}

const EXAMPLES = new Map(
  [
    ...GALLERY_SECTIONS.map(toEntry),
    ...INTERACTIVE_SECTIONS.map(toEntry),
    ...COMPOSED_EXAMPLES.map(toConversationEntry),
  ].map((entry) => [entry.id, entry] as const),
);

function UnknownExample({ id }: { id: string }) {
  return (
    <div className="not-prose my-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
      No example named <code className="font-mono">{id}</code>. Add it to{" "}
      <code className="font-mono">vexa/examples</code> or fix the id on this page.
    </div>
  );
}

function ConversationPreview({
  conversation,
  spec,
}: {
  conversation: Conversation;
  spec: Spec;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {conversation.prompt}
      </p>
      <p className="text-sm text-foreground">{conversation.prose}</p>
      <SpecView showDevtools={false} spec={spec} />
    </div>
  );
}


/** Renders a `vexa/examples` spec at chat width with its spec JSON and SpecStream lines. */
export function Example({ id }: { id: string }) {
  const example = EXAMPLES.get(id);
  if (!example) return <UnknownExample id={id} />;

  return (
    <div
      id={exampleElementId(id)}
      className="not-prose my-6 flex flex-col gap-2 scroll-mt-24 transition-shadow"
      {...{ [EXAMPLE_ATTRIBUTE]: id }}
    >
      <p className="text-sm text-muted-foreground">{example.note}</p>
      <Tabs className="my-0" items={TAB_LABELS}>
        <Tab value="preview">
          <ChatWidthFrame>
            {example.conversation ? (
              <ConversationPreview conversation={example.conversation} spec={example.spec} />
            ) : (
              <SpecView showDevtools={false} spec={example.spec} />
            )}
          </ChatWidthFrame>
        </Tab>
        <Tab value="spec">
          <CodeSurface lang="json" title={`${id}.spec.json`} code={JSON.stringify(example.spec, null, 2)} />
        </Tab>
        <Tab value="jsonl">
          <CodeSurface lang="jsonl" title={`${id}.jsonl`} code={specStreamText(example.spec)} />
        </Tab>
      </Tabs>
    </div>
  );
}
