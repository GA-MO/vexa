import { CHAT_ELEMENT_EXAMPLES } from "vexa/examples";
import { ExampleConversation } from "@/components/chat-elements-conversation";

function NoteText({ text }: { text: string }) {
  const segments = text.split("`");
  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === 1 ? <code key={index}>{segment}</code> : <span key={index}>{segment}</span>,
      )}
    </>
  );
}

export function ChatElements() {
  return (
    <div className="flex flex-col gap-10">
      {CHAT_ELEMENT_EXAMPLES.map((example) => (
        <section className="flex flex-col gap-3" id={example.id} key={example.id}>
          <h3 className="m-0 text-base font-semibold">{example.title}</h3>
          <p className="m-0 text-sm text-muted-foreground">
            <NoteText text={example.note} />
          </p>
          <ExampleConversation example={example} />
        </section>
      ))}
    </div>
  );
}
