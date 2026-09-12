"use client";

import { AssistantMessage, UserMessage, type ChatStepsDisplay } from "vexa/chat";
import { CHAT_ELEMENT_MESSAGES } from "@/lib/test-plans/chat-elements";

const COLUMNS = [
  { width: 340, steps: "collapsible" },
  { width: 600, steps: "collapsible" },
  { width: 340, steps: "hidden" },
] as const;

function ChatColumn({ width, steps }: { width: number; steps: ChatStepsDisplay }) {
  return (
    <section className="flex shrink-0 flex-col gap-3" style={{ width }}>
      <h2 className="text-sm font-medium text-muted-foreground">
        {width}px · steps {steps}
      </h2>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        {CHAT_ELEMENT_MESSAGES.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              key={message.id}
              isLast={index === CHAT_ELEMENT_MESSAGES.length - 1}
              isStreaming={false}
              message={message}
              messages={CHAT_ELEMENT_MESSAGES}
              onApproval={(id, approved) => console.log("approval", id, approved)}
              steps={steps}
            />
          ),
        )}
      </div>
    </section>
  );
}

export default function ChatElementsTestPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Chat elements</h1>
          <p className="text-sm text-muted-foreground">
            Every message part the chat renders, from fixed messages, at the narrowest and widest panel widths. Nothing may be clipped or overflow its column.
          </p>
        </header>
        <div className="flex items-start gap-8 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <ChatColumn key={`${column.width}-${column.steps}`} steps={column.steps} width={column.width} />
          ))}
        </div>
      </div>
    </main>
  );
}
