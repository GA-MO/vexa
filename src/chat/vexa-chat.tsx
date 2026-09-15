"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { CheckIcon, RotateCcwIcon, Sparkles, XIcon } from "lucide-react";
import type { VexaMessage } from "vexa/protocol";
import { useVexaHostContext, type PendingConfirmation } from "vexa/react";
import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRequest,
  ConfirmationTitle,
} from "vexa/ai-elements/confirmation";
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "vexa/ai-elements/checkpoint";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "vexa/ai-elements/conversation";
import {
  PromptInput,
  type PromptInputMessage,
} from "vexa/ai-elements/prompt-input";
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
} from "vexa/ai-elements/queue";
import {
  Suggestion,
  Suggestions,
} from "vexa/ai-elements/suggestion";
import { cn } from "vexa/lib/utils";
import { ChatComposer } from "./composer";
import {
  DEFAULT_LABELS,
  MODELS,
  SUGGESTIONS,
  type ChatComposerOptions,
  type ChatLabels,
  type ChatModel,
  type ChatStepsDisplay,
  type ChatSuggestion,
} from "./constants";
import { AssistantMessage, UserMessage } from "./messages";
import { estimateTokens, estimateUsage } from "./usage";

/** `panel` is a framed card that fills its box, `inline` fills its box flush (no radius, border, or shadow) to dock into the host's own layout, `page` takes the viewport. */
export type VexaChatLayout = "page" | "panel" | "inline";

const PAGE_COLUMN = "mx-auto w-full max-w-3xl";

const LAYOUT_FRAME: Record<VexaChatLayout, string> = {
  panel: "h-full rounded-[1.35rem] border border-border/70 shadow-[0_28px_80px_-24px_var(--vexa-glow),0_12px_32px_-16px_var(--vexa-glow-violet)]",
  inline: "h-full",
  page: "h-dvh bg-background",
};

export type VexaChatProps = {
  api?: string;
  title?: string;
  subtitle?: string;
  layout?: VexaChatLayout;
  className?: string;
  models?: readonly ChatModel[];
  defaultModel?: string;
  suggestions?: readonly ChatSuggestion[];
  labels?: Partial<ChatLabels>;
  steps?: ChatStepsDisplay;
  /** Hide composer controls: `attachments`, `modelPicker` (shown by default only with more than one model), `tokenUsage`. */
  composer?: ChatComposerOptions;
  logo?: React.ReactNode;
  onClose?: () => void;
  /** Called with the full message list whenever it changes, so hosts can inspect streamed specs. */
  onMessagesChange?: (messages: VexaMessage[]) => void;
};

function firstNonEmpty<T>(...candidates: Array<readonly T[] | undefined>): readonly T[] {
  return candidates.find((list) => list && list.length > 0) ?? [];
}

type RemoteModels = { models: readonly ChatModel[]; defaultModel?: string };

function useRemoteModels(endpoint: string, enabled: boolean): RemoteModels {
  const [remote, setRemote] = useState<RemoteModels>({ models: [] });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(endpoint, { method: "GET", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { models?: ChatModel[]; default?: string | null } | null) => {
        if (!payload || !Array.isArray(payload.models) || payload.models.length === 0) return;
        setRemote({ models: payload.models, defaultModel: payload.default ?? undefined });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [endpoint, enabled]);
  return remote;
}

const STREAM_THROTTLE_MS = 50;
const FILE_ACCEPT = "image/*,application/pdf,text/*";

type CheckpointRecord = {
  id: string;
  messageIndex: number;
};

export function VexaChat({
  api,
  title: titleProp,
  subtitle: subtitleProp,
  layout = "panel",
  className,
  models: modelsProp,
  defaultModel,
  suggestions: suggestionsProp,
  labels: labelsProp,
  steps: stepsProp,
  composer: composerProp,
  logo: logoProp,
  onClose,
  onMessagesChange,
}: VexaChatProps) {
  const host = useVexaHostContext();
  const endpoint = api ?? host?.api ?? "/api/chat";
  const title = titleProp ?? host?.chat.title ?? "Vexa";
  const logo = logoProp ?? host?.chat.logo ?? <Sparkles className="size-4" />;
  const subtitle = subtitleProp ?? host?.chat.subtitle ?? "Ask · stream · render UI";
  const steps = stepsProp ?? host?.chat.steps ?? "collapsible";
  const labels = useMemo<ChatLabels>(
    () => ({ ...DEFAULT_LABELS, ...host?.chat.labels, ...labelsProp }),
    [host?.chat.labels, labelsProp],
  );
  const composer = useMemo<ChatComposerOptions>(
    () => ({ ...host?.chat.composer, ...composerProp }),
    [host?.chat.composer, composerProp],
  );
  const acceptsFiles = composer.attachments ?? true;
  const remote = useRemoteModels(endpoint, !modelsProp && !host?.chat.models);
  const models = firstNonEmpty(modelsProp, host?.chat.models, remote.models, MODELS);
  const suggestions = firstNonEmpty(suggestionsProp, host?.chat.suggestions, SUGGESTIONS);
  const initialModel = defaultModel ?? host?.chat.defaultModel ?? remote.defaultModel ?? models[0].id;
  const [text, setText] = useState("");
  const [model, setModel] = useState<string>(initialModel);
  const userPickedModel = useRef(false);
  const pickModel = useCallback((id: string) => {
    userPickedModel.current = true;
    setModel(id);
  }, []);

  useEffect(() => {
    const known = models.some((item) => item.id === model);
    if (known && userPickedModel.current) return;
    if (known && model === initialModel) return;
    setModel(initialModel);
  }, [initialModel, model, models]);
  const [checkpoints, setCheckpoints] = useState<CheckpointRecord[]>([]);
  const [queue, setQueue] = useState<QueueMessage[]>([]);
  const modelRef = useRef(model);
  modelRef.current = model;
  const hostRef = useRef(host);
  hostRef.current = host;

  const transport = useMemo(
    () =>
      new DefaultChatTransport<VexaMessage>({
        api: endpoint,
        body: async () => ({
          model: modelRef.current,
          context: (await hostRef.current?.readContext()) ?? {},
          hostTools: hostRef.current?.schemas ?? [],
        }),
      }),
    [endpoint],
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    addToolApprovalResponse,
    addToolOutput,
  } = useChat<VexaMessage>({
    transport,
    experimental_throttle: STREAM_THROTTLE_MS,
    sendAutomaticallyWhen: (options) =>
      lastAssistantMessageIsCompleteWithToolCalls(options) ||
      lastAssistantMessageIsCompleteWithApprovalResponses(options),
    onToolCall: ({ toolCall }) => {
      const currentHost = hostRef.current;
      if (toolCall.dynamic || !currentHost?.hasTool(toolCall.toolName)) return;
      void (async () => {
        const output = await currentHost.runTool(toolCall.toolName, toolCall.input, {
          toolCallId: toolCall.toolCallId,
          source: "model",
        });
        addToolOutput({
          tool: toolCall.toolName as never,
          toolCallId: toolCall.toolCallId,
          output: output as never,
        });
      })();
    },
  });

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const isStreaming = status === "streaming" || status === "submitted";
  const selected = models.find((item) => item.id === model) ?? models[0];
  const usedTokens = useMemo(() => estimateTokens(messages), [messages]);
  const usage = useMemo(() => estimateUsage(messages), [messages]);
  const isCompact = layout !== "page";
  const pageColumn = layout === "page" ? PAGE_COLUMN : undefined;

  const sendNow = useCallback(
    async (message: PromptInputMessage) => {
      const next = message.text.trim();
      const files = message.files ?? [];
      if (!next && files.length === 0) return;

      setText("");
      await sendMessage({
        text: next || labels.sentWithAttachments,
        files,
      });
    },
    [labels.sentWithAttachments, sendMessage],
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
              { type: "text", text: next || labels.sentWithAttachments },
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
    [isStreaming, labels.sentWithAttachments, sendNow],
  );

  const submitText = useCallback(
    async (value: string) => {
      await submitPrompt({ text: value, files: [] });
    },
    [submitPrompt],
  );

  useEffect(() => {
    if (!host) return;
    host.registerChatSender((value) => void submitText(value));
    return () => host.registerChatSender(null);
  }, [host, submitText]);

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
        LAYOUT_FRAME[layout],
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.09] via-brand-violet/[0.04] to-transparent"
      />
      <div
        aria-hidden
        className="vexa-glow pointer-events-none absolute -left-16 top-8 size-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="vexa-glow pointer-events-none absolute -right-10 top-20 size-44 rounded-full bg-brand-violet/15 blur-3xl"
      />

      <header className="relative z-10 border-b border-border/60 px-4 py-3 backdrop-blur-md">
        <div className={cn("flex items-center gap-3", pageColumn)}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-violet text-primary-foreground shadow-md shadow-primary/35">
            {logo}
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
                aria-label={labels.startOver}
                onClick={resetChat}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcwIcon className="size-3.5" />
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                aria-label={labels.closeChat}
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Conversation className="relative min-h-0 flex-1">
          <ConversationContent
            className={cn("gap-5", isCompact ? "px-3 py-3" : "px-4 py-4 sm:px-6", pageColumn)}
          >
            {messages.length === 0 ? (
              <ConversationEmptyState
                className="px-2"
                title={labels.emptyTitle}
                description={labels.emptyDescription}
                icon={
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-brand-violet/15 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                }
              />
            ) : (
              messages.map((message, index) => {
                const hasLaterMessages = index < messages.length - 1;
                const checkpoint = hasLaterMessages
                  ? checkpoints.find((item) => item.messageIndex === index)
                  : undefined;

                return (
                  <Fragment key={message.id}>
                    {message.role === "user" ? (
                      <UserMessage labels={labels} message={message} />
                    ) : (
                      <AssistantMessage
                        isLast={index === messages.length - 1}
                        isStreaming={isStreaming}
                        labels={labels}
                        message={message}
                        messages={messages}
                        steps={steps}
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
                          tooltip={labels.restoreTooltip}
                        >
                          {labels.restore}
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
            "shrink-0 border-t border-border/60 bg-card/80 backdrop-blur-md",
            isCompact ? "p-3" : "p-4 sm:px-6",
          )}
        >
          <div className={cn("space-y-2", pageColumn)}>
            {queue.length > 0 ? (
              <Queue className="rounded-xl border border-border/70 bg-muted/40 p-1.5">
                <QueueSection defaultOpen>
                  <QueueSectionTrigger>
                    <QueueSectionLabel count={queue.length} label={labels.queued} />
                  </QueueSectionTrigger>
                  <QueueSectionContent>
                    <QueueList>
                      {queue.map((item) => {
                        const label =
                          item.parts.find((part) => part.type === "text")
                            ?.text ?? labels.attachment;
                        return (
                          <QueueItem key={item.id}>
                            <div className="flex items-start gap-2">
                              <QueueItemIndicator />
                              <QueueItemContent>{label}</QueueItemContent>
                              <QueueItemActions>
                                <QueueItemAction
                                  aria-label={labels.removeQueued}
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
                {suggestions.map((item) => (
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

            {host?.pending.map((item) => (
              <HostToolConfirmation
                key={item.id}
                item={item}
                labels={labels}
                onDecide={(approved) => host.resolveConfirmation(item.id, approved)}
              />
            ))}

            {error ? (
              <p className="text-sm text-destructive">{error.message}</p>
            ) : null}

            <PromptInput
              accept={FILE_ACCEPT}
              className="rounded-2xl border border-border/80 bg-background shadow-[0_10px_30px_-18px] shadow-primary/45"
              globalDrop={acceptsFiles}
              maxFiles={acceptsFiles ? undefined : 0}
              multiple
              onSubmit={(message) => void submitPrompt(message)}
            >
              <ChatComposer
                labels={labels}
                maxTokens={selected.maxTokens}
                models={models}
                model={model}
                options={composer}
                setModel={pickModel}
                setText={setText}
                status={status}
                text={text}
                usage={usage}
                usedTokens={usedTokens}
              />
            </PromptInput>
          </div>
        </div>
      </div>
    </section>
  );
}

function HostToolConfirmation({
  item,
  labels,
  onDecide,
}: {
  item: PendingConfirmation;
  labels: ChatLabels;
  onDecide: (approved: boolean) => void;
}) {
  return (
    <Confirmation
      approval={{ id: item.id }}
      className="rounded-xl border border-border/70 bg-muted/40 p-3"
      state="approval-requested"
    >
      <ConfirmationTitle>
        <ConfirmationRequest>
          <span>
            {labels.runOnPage(item.name)}
            <span className="block text-xs text-muted-foreground">{item.description}</span>
          </span>
        </ConfirmationRequest>
      </ConfirmationTitle>
      <ConfirmationActions>
        <ConfirmationAction onClick={() => onDecide(false)} variant="outline">
          <XIcon className="size-3.5" />
          {labels.cancel}
        </ConfirmationAction>
        <ConfirmationAction onClick={() => onDecide(true)} variant="default">
          <CheckIcon className="size-3.5" />
          {labels.run}
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}
