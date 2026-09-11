"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { RotateCcwIcon, Sparkles, XIcon } from "lucide-react";
import type { AgenticMessage } from "agentic-ui/protocol";
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "agentic-ui/ai-elements/checkpoint";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "agentic-ui/ai-elements/conversation";
import {
  PromptInput,
  type PromptInputMessage,
} from "agentic-ui/ai-elements/prompt-input";
import {
  Queue,
  QueueItem,
  QueueItemAction,
  QueueItemActions,
  QueueItemContent,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
  type QueueMessage,
} from "agentic-ui/ai-elements/queue";
import {
  Suggestion,
  Suggestions,
} from "agentic-ui/ai-elements/suggestion";
import { cn } from "agentic-ui/lib/utils";
import { ChatComposer } from "./composer";
import { MODELS, SUGGESTIONS } from "./constants";
import { AssistantMessage, UserMessage } from "./messages";
import { estimateTokens, estimateUsage } from "./usage";

export type AgenticChatLayout = "page" | "panel";

export type AgenticChatProps = {
  api?: string;
  title?: string;
  subtitle?: string;
  layout?: AgenticChatLayout;
  className?: string;
  onClose?: () => void;
};

type CheckpointRecord = {
  id: string;
  messageIndex: number;
};

export function AgenticChat({
  api = "/api/chat",
  title = "Agentic UI",
  subtitle = "Ask · stream · render UI",
  layout = "panel",
  className,
  onClose,
}: AgenticChatProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api }),
    [api],
  );

  const [text, setText] = useState("");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [checkpoints, setCheckpoints] = useState<CheckpointRecord[]>([]);
  const [queue, setQueue] = useState<QueueMessage[]>([]);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    addToolApprovalResponse,
  } = useChat<AgenticMessage>({ transport });

  const isStreaming = status === "streaming" || status === "submitted";
  const selected = MODELS.find((item) => item.id === model) ?? MODELS[0];
  const usedTokens = useMemo(() => estimateTokens(messages), [messages]);
  const usage = useMemo(() => estimateUsage(messages), [messages]);
  const isPanel = layout === "panel";

  const sendNow = useCallback(
    async (message: PromptInputMessage) => {
      const next = message.text.trim();
      const files = message.files ?? [];
      if (!next && files.length === 0) return;

      setText("");
      await sendMessage(
        {
          text: next || "Sent with attachments",
          files,
        },
        { body: { model } },
      );
    },
    [model, sendMessage],
  );

  useEffect(() => {
    if (isStreaming || queue.length === 0) return;

    const [next, ...rest] = queue;
    setQueue(rest);
    const textPart = next.parts.find((part) => part.type === "text");
    void sendNow({
      text: textPart?.text ?? "",
      files: [],
    });
  }, [isStreaming, queue, sendNow]);

  const submitPrompt = useCallback(
    async (message: PromptInputMessage) => {
      const next = message.text.trim();
      const files = message.files ?? [];
      if (!next && files.length === 0) return;

      if (isStreaming) {
        setQueue((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            parts: [
              { type: "text", text: next || "Sent with attachments" },
              ...(files.map((file) => ({
                type: "file",
                url: file.url,
                filename: file.filename,
                mediaType: file.mediaType,
              })) as QueueMessage["parts"]),
            ],
          },
        ]);
        setText("");
        return;
      }

      await sendNow(message);
    },
    [isStreaming, sendNow],
  );

  const submitText = useCallback(
    async (value: string) => {
      await submitPrompt({ text: value, files: [] });
    },
    [submitPrompt],
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setText("");
    setCheckpoints([]);
    setQueue([]);
  }, [setMessages]);

  const createCheckpoint = useCallback((messageIndex: number) => {
    setCheckpoints((current) => {
      if (current.some((item) => item.messageIndex === messageIndex)) {
        return current;
      }
      return [...current, { id: crypto.randomUUID(), messageIndex }];
    });
  }, []);

  const restoreCheckpoint = useCallback(
    (messageIndex: number) => {
      setMessages(messages.slice(0, messageIndex + 1));
      setCheckpoints((current) =>
        current.filter((item) => item.messageIndex <= messageIndex),
      );
      setQueue([]);
    },
    [messages, setMessages],
  );

  useEffect(() => {
    if (isStreaming || messages.length === 0) return;
    const lastIndex = messages.length - 1;
    if (messages[lastIndex]?.role === "assistant") {
      createCheckpoint(lastIndex);
    }
  }, [createCheckpoint, isStreaming, messages]);

  return (
    <section
      aria-label={title}
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden bg-card text-card-foreground",
        isPanel
          ? "h-full rounded-[1.35rem] border border-border/70 shadow-[0_28px_80px_-24px_rgba(79,70,229,0.45),0_12px_32px_-16px_rgba(124,58,237,0.25)]"
          : "h-dvh bg-background",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.09] via-brand-violet/[0.04] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-8 size-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-20 size-44 rounded-full bg-brand-violet/15 blur-3xl"
      />

      <header className="relative z-10 flex items-center gap-3 border-b border-border/60 px-4 py-3 backdrop-blur-md">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-violet text-primary-foreground shadow-md shadow-primary/35">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-brand-violet bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="truncate text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 ? (
            <button
              type="button"
              aria-label="Start over"
              onClick={resetChat}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcwIcon className="size-3.5" />
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              aria-label="Close chat"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Conversation className="relative min-h-0 flex-1">
          <ConversationContent
            className={cn("gap-5", isPanel ? "px-3 py-3" : "px-4 py-4 sm:px-6")}
          >
            {messages.length === 0 ? (
              <ConversationEmptyState
                className="px-2"
                title="Ask anything. Get UI back."
                description="Stream an answer, or generate cards, metrics, and tables in place."
                icon={
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-brand-violet/15 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                }
              />
            ) : (
              messages.map((message, index) => {
                const checkpoint = checkpoints.find(
                  (item) => item.messageIndex === index,
                );

                return (
                  <Fragment key={message.id}>
                    {message.role === "user" ? (
                      <UserMessage message={message} />
                    ) : (
                      <AssistantMessage
                        isLast={index === messages.length - 1}
                        isStreaming={isStreaming}
                        message={message}
                        messages={messages}
                        onApproval={(id, approved) =>
                          void addToolApprovalResponse({ id, approved })
                        }
                      />
                    )}
                    {checkpoint ? (
                      <Checkpoint>
                        <CheckpointIcon />
                        <CheckpointTrigger
                          onClick={() =>
                            restoreCheckpoint(checkpoint.messageIndex)
                          }
                          tooltip="Restore conversation to this point"
                        >
                          Restore
                        </CheckpointTrigger>
                      </Checkpoint>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div
          className={cn(
            "shrink-0 space-y-2 border-t border-border/60 bg-card/80 backdrop-blur-md",
            isPanel ? "p-3" : "p-4 sm:px-6",
          )}
        >
          {queue.length > 0 ? (
            <Queue className="rounded-xl border border-border/70 bg-muted/40 p-1.5">
              <QueueSection defaultOpen>
                <QueueSectionTrigger>
                  <QueueSectionLabel count={queue.length} label="Queued" />
                </QueueSectionTrigger>
                <QueueSectionContent>
                  <QueueList>
                    {queue.map((item) => {
                      const label =
                        item.parts.find((part) => part.type === "text")
                          ?.text ?? "Attachment";
                      return (
                        <QueueItem key={item.id}>
                          <div className="flex items-start gap-2">
                            <QueueItemIndicator />
                            <QueueItemContent>{label}</QueueItemContent>
                            <QueueItemActions>
                              <QueueItemAction
                                aria-label="Remove queued message"
                                onClick={() =>
                                  setQueue((current) =>
                                    current.filter(
                                      (entry) => entry.id !== item.id,
                                    ),
                                  )
                                }
                              >
                                <XIcon className="size-3.5" />
                              </QueueItemAction>
                            </QueueItemActions>
                          </div>
                        </QueueItem>
                      );
                    })}
                  </QueueList>
                </QueueSectionContent>
              </QueueSection>
            </Queue>
          ) : null}

          {messages.length === 0 ? (
            <Suggestions className="px-0.5">
              {SUGGESTIONS.map((item) => (
                <Suggestion
                  key={item.label}
                  suggestion={item.prompt}
                  onClick={(value) => void submitText(value)}
                >
                  {item.label}
                </Suggestion>
              ))}
            </Suggestions>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : null}

          <PromptInput
            accept="image/*,application/pdf,text/*"
            className="rounded-2xl border border-border/80 bg-background shadow-[0_10px_30px_-18px_rgba(79,70,229,0.45)]"
            globalDrop
            multiple
            onSubmit={(message) => void submitPrompt(message)}
          >
            <ChatComposer
              maxTokens={selected.maxTokens}
              model={model}
              setModel={setModel}
              setText={setText}
              status={status}
              text={text}
              usage={usage}
              usedTokens={usedTokens}
            />
          </PromptInput>
        </div>
      </div>
    </section>
  );
}
