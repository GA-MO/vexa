import { AssistantMessage, UserMessage } from "vexa/chat";
import type { ChatElementExample } from "vexa/examples";
import { ChatWidthFrame } from "@/components/chat-width-frame";

export function ExampleConversation({ example }: { example: ChatElementExample }) {
  const { messages } = example;
  return (
    <ChatWidthFrame>
      <div className="flex flex-col gap-4">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              isLast={index === messages.length - 1}
              isStreaming={false}
              key={message.id}
              message={message}
              messages={messages}
              onApproval={() => undefined}
            />
          ),
        )}
      </div>
    </ChatWidthFrame>
  );
}
