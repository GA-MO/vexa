"use client";

import { useJsonRenderMessage } from "@json-render/react";
import { useEffect, useRef, useState } from "react";
import {
  getToolName,
  isFileUIPart,
  isToolUIPart,
  type DynamicToolUIPart,
  type FileUIPart,
  type ReasoningUIPart,
  type ToolUIPart,
} from "ai";
import {
  CheckIcon,
  PaperclipIcon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react";
import {
  SPEC_DATA_PART_TYPE,
  reasoningSeconds as stampedSeconds,
  type VexaMessage,
} from "vexa/protocol";
import { DEFAULT_LABELS, type ChatLabels, type ChatStepsDisplay } from "./constants";
import { SpecView } from "vexa/react";
import {
  Attachment,
  AttachmentPreview,
  Attachments,
} from "vexa/ai-elements/attachments";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "vexa/ai-elements/chain-of-thought";
import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "vexa/ai-elements/confirmation";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationSource,
} from "vexa/ai-elements/inline-citation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "vexa/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "vexa/ai-elements/reasoning";
import { Shimmer } from "vexa/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "vexa/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "vexa/ai-elements/tool";

function ToolApproval({
  part,
  onApproval,
  labels,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
}) {
  const approval =
    "approval" in part
      ? (part.approval as { id: string; approved?: boolean } | undefined)
      : undefined;
  if (!approval || !onApproval) return null;

  const toolName = getToolName(part);
  return (
    <Confirmation approval={approval} state={part.state}>
      <ConfirmationTitle>
        <ConfirmationRequest>{labels.approveTool(toolName)}</ConfirmationRequest>
        <ConfirmationAccepted>
          <CheckIcon className="size-4" />
          <span>{labels.approved}</span>
        </ConfirmationAccepted>
        <ConfirmationRejected>
          <XIcon className="size-4" />
          <span>{labels.rejected}</span>
        </ConfirmationRejected>
      </ConfirmationTitle>
      <ConfirmationActions>
        <ConfirmationAction
          onClick={() => onApproval(approval.id, false)}
          variant="outline"
        >
          {labels.reject}
        </ConfirmationAction>
        <ConfirmationAction
          onClick={() => onApproval(approval.id, true)}
          variant="default"
        >
          {labels.approve}
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}

function ToolPartView({
  part,
  messageId,
  index,
  onApproval,
  labels,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  messageId: string;
  index: number;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
}) {
  const toolName = getToolName(part);

  return (
    <div className="space-y-2" key={`${messageId}-tool-${index}`}>
      <Tool defaultOpen={part.state !== "output-available"}>
        {part.type === "dynamic-tool" ? (
          <ToolHeader
            state={part.state}
            title={toolName}
            toolName={toolName}
            type="dynamic-tool"
          />
        ) : (
          <ToolHeader state={part.state} title={toolName} type={part.type} />
        )}
        <ToolContent>
          {"input" in part && part.input != null ? (
            <ToolInput input={part.input} />
          ) : null}
          <ToolOutput
            errorText={"errorText" in part ? part.errorText : undefined}
            output={"output" in part ? part.output : undefined}
          />
        </ToolContent>
      </Tool>
      <ToolApproval labels={labels} onApproval={onApproval} part={part} />
    </div>
  );
}

function HiddenSteps({
  toolParts,
  onApproval,
  labels,
}: {
  toolParts: Array<ToolUIPart | DynamicToolUIPart>;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
}) {
  const approvals = toolParts.filter((part) => "approval" in part && part.approval);
  if (approvals.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {approvals.map((part) => (
        <ToolApproval key={part.toolCallId} labels={labels} onApproval={onApproval} part={part} />
      ))}
    </div>
  );
}

const MS_IN_SECOND = 1000;

type ProcessPart = ReasoningUIPart | ToolUIPart | DynamicToolUIPart;

type IndexedPart = { part: ProcessPart; index: number };

type ReasoningSeconds = Record<number, number>;

const isReasoningPart = (part: VexaMessage["parts"][number]): part is ReasoningUIPart =>
  part.type === "reasoning";

const isProcessPart = (part: VexaMessage["parts"][number]): part is ProcessPart =>
  isReasoningPart(part) || isToolUIPart(part);

const FINISHED_TOOL_STATES = new Set(["output-available", "output-error", "output-denied"]);

function useReasoningSeconds(parts: VexaMessage["parts"]) {
  const startedAt = useRef(new Map<number, number>());
  const [seconds, setSeconds] = useState<ReasoningSeconds>({});

  useEffect(() => {
    const now = Date.now();
    parts.forEach((part, index) => {
      if (!isReasoningPart(part)) return;
      if (part.state === "streaming") {
        if (!startedAt.current.has(index)) startedAt.current.set(index, now);
        return;
      }
      const start = startedAt.current.get(index);
      if (start === undefined) return;
      startedAt.current.delete(index);
      const elapsed = Math.max(1, Math.round((now - start) / MS_IN_SECOND));
      setSeconds((prev) => ({ ...prev, [index]: elapsed }));
    });
  }, [parts]);

  return Object.fromEntries(
    parts.flatMap((part, index) => {
      if (!isReasoningPart(part) || part.state === "streaming") return [];
      const value = stampedSeconds(part) ?? seconds[index];
      return value === undefined ? [] : [[index, value] as const];
    }),
  ) as ReasoningSeconds;
}

function reasoningLabel(isStreaming: boolean, seconds: number | undefined, labels: ChatLabels) {
  if (isStreaming) return <Shimmer duration={1.2}>{labels.thinking}</Shimmer>;
  if (seconds === undefined) return labels.reasoning;
  return labels.thoughtFor(seconds);
}

function processHeader(
  isStreaming: boolean,
  seconds: number | undefined,
  stepCount: number,
  labels: ChatLabels,
) {
  if (isStreaming) return <Shimmer duration={1.2}>{labels.thinking}</Shimmer>;
  if (seconds === undefined) return labels.steps(stepCount);
  return labels.thoughtFor(seconds);
}

function totalSeconds(seconds: ReasoningSeconds) {
  const measured = Object.values(seconds);
  if (measured.length === 0) return undefined;
  return measured.reduce((sum, value) => sum + value, 0);
}

function ReasoningBlock({
  parts,
  seconds,
  labels,
}: {
  parts: VexaMessage["parts"];
  seconds: ReasoningSeconds;
  labels: ChatLabels;
}) {
  const reasoningParts = parts.filter(isReasoningPart);
  const isStreaming = reasoningParts.some((part) => part.state === "streaming");
  const text = reasoningParts.map((part) => part.text).join("\n\n");

  return (
    <Reasoning duration={totalSeconds(seconds)} isStreaming={isStreaming}>
      <ReasoningTrigger
        getThinkingMessage={(streaming, duration) => reasoningLabel(streaming, duration, labels)}
      />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
}

function ProcessSteps({
  message,
  isStreaming,
  onApproval,
  labels,
  processParts,
  reasoningSeconds,
}: {
  message: VexaMessage;
  isStreaming: boolean;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
  processParts: IndexedPart[];
  reasoningSeconds: ReasoningSeconds;
}) {
  const [open, setOpen] = useState(false);
  const awaitingApproval = processParts.some(({ part }) => part.state === "approval-requested");

  return (
    <ChainOfThought onOpenChange={setOpen} open={open || awaitingApproval}>
      <ChainOfThoughtHeader>
        {processHeader(isStreaming, totalSeconds(reasoningSeconds), processParts.length, labels)}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {processParts.map(({ part, index }) =>
          isReasoningPart(part) ? (
            <ChainOfThoughtStep
              key={`${message.id}-cot-${index}`}
              label={reasoningLabel(part.state === "streaming", undefined, labels)}
              status={part.state === "streaming" ? "active" : "complete"}
            >
              <MessageResponse className="text-muted-foreground">{part.text}</MessageResponse>
            </ChainOfThoughtStep>
          ) : (
            <ChainOfThoughtStep
              key={`${message.id}-cot-${index}`}
              label={getToolName(part)}
              status={FINISHED_TOOL_STATES.has(part.state) ? "complete" : "active"}
            >
              <ToolPartView
                index={index}
                labels={labels}
                messageId={message.id}
                onApproval={onApproval}
                part={part}
              />
            </ChainOfThoughtStep>
          ),
        )}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

export function AssistantMessage({
  message,
  isLast,
  isStreaming,
  onApproval,
  messages,
  labels = DEFAULT_LABELS,
  steps = "collapsible",
}: {
  message: VexaMessage;
  isLast: boolean;
  isStreaming: boolean;
  onApproval?: (id: string, approved: boolean) => void;
  messages?: VexaMessage[];
  labels?: ChatLabels;
  steps?: ChatStepsDisplay;
}) {
  const { spec, hasSpec } = useJsonRenderMessage(message.parts);
  const sourceParts = message.parts.filter(
    (part) => part.type === "source-url" || part.type === "source-document",
  );
  const sourceUrls = sourceParts
    .filter((part) => part.type === "source-url")
    .map((part) => part.url);
  const hasReasoning = message.parts.some(isReasoningPart);
  const toolParts = message.parts.filter(isToolUIPart);
  const noticeParts = message.parts.filter((part) => part.type === "data-notice");
  const processParts = message.parts
    .map((part, index) => ({ part, index }))
    .filter((entry): entry is IndexedPart => isProcessPart(entry.part));
  const reasoningSeconds = useReasoningSeconds(message.parts);

  const lastTextIndex = message.parts.reduce(
    (last, part, index) =>
      part.type === "text" && part.text.trim() ? index : last,
    -1,
  );

  let renderedSpec = false;
  let hasVisibleContent = false;

  const content = message.parts.map((part, index) => {
    if (part.type === "text") {
      if (!part.text.trim()) return null;
      hasVisibleContent = true;
      return (
        <div className="space-y-2" key={`${message.id}-text-${index}`}>
          <MessageResponse isAnimating={isLast && isStreaming}>
            {part.text}
          </MessageResponse>
          {sourceUrls.length > 0 && index === lastTextIndex ? (
            <InlineCitation>
              <InlineCitationCard>
                <InlineCitationCardTrigger sources={sourceUrls} />
                <InlineCitationCardBody>
                  {sourceParts.map((source, sourceIndex) =>
                    source.type === "source-url" ? (
                      <InlineCitationSource
                        description={source.title}
                        key={`${message.id}-inline-${sourceIndex}`}
                        title={source.title ?? source.url}
                        url={source.url}
                      />
                    ) : null,
                  )}
                </InlineCitationCardBody>
              </InlineCitationCard>
            </InlineCitation>
          ) : null}
        </div>
      );
    }

    if (part.type === "reasoning" || isToolUIPart(part)) {
      return null;
    }

    if (part.type === SPEC_DATA_PART_TYPE) {
      if (!hasSpec || renderedSpec) return null;
      renderedSpec = true;
      hasVisibleContent = true;
      return (
        <SpecView
          key={`${message.id}-spec`}
          loading={isLast && isStreaming}
          messages={messages}
          showDevtools={isLast}
          spec={spec}
        />
      );
    }

    return null;
  });

  if (processParts.length > 0 && steps === "collapsible") {
    hasVisibleContent = true;
  }

  if (hasSpec && !renderedSpec) {
    hasVisibleContent = true;
    content.push(
      <SpecView
        key={`${message.id}-spec-fallback`}
        loading={isLast && isStreaming}
        messages={messages}
        showDevtools={isLast}
        spec={spec}
      />,
    );
  }

  const showLoader = isLast && isStreaming && !hasVisibleContent;

  return (
    <Message from="assistant">
      <MessageContent className="w-full max-w-none gap-3 bg-transparent px-0 py-0">
        {sourceParts.length > 0 ? (
          <Sources>
            <SourcesTrigger count={sourceParts.length} />
            <SourcesContent>
              {sourceParts.map((part, index) => {
                if (part.type === "source-url") {
                  return (
                    <Source
                      href={part.url}
                      key={`${message.id}-source-${index}`}
                      title={part.title ?? part.url}
                    />
                  );
                }

                return (
                  <Source
                    href={`#${part.sourceId}`}
                    key={`${message.id}-source-${index}`}
                    title={part.title}
                  >
                    <PaperclipIcon className="size-4" />
                    <span className="font-medium">{part.title}</span>
                  </Source>
                );
              })}
            </SourcesContent>
          </Sources>
        ) : null}

        {processParts.length > 0 && steps === "hidden" ? (
          <HiddenSteps labels={labels} onApproval={onApproval} toolParts={toolParts} />
        ) : null}

        {steps === "collapsible" && toolParts.length === 0 && hasReasoning ? (
          <ReasoningBlock labels={labels} parts={message.parts} seconds={reasoningSeconds} />
        ) : null}

        {steps === "collapsible" && toolParts.length > 0 ? (
          <ProcessSteps
            isStreaming={isLast && isStreaming}
            labels={labels}
            message={message}
            onApproval={onApproval}
            processParts={processParts}
            reasoningSeconds={reasoningSeconds}
          />
        ) : null}

        {noticeParts.map((part, index) => (
          <SecurityNoticeView
            key={`${message.id}-notice-${index}`}
            labels={labels}
            notice={part.data}
          />
        ))}

        {content}

        {showLoader ? (
          <Shimmer className="text-sm" duration={1.2}>
            {labels.thinking}
          </Shimmer>
        ) : null}
      </MessageContent>
    </Message>
  );
}

export function UserMessage({ message }: { message: VexaMessage }) {
  const files = message.parts.filter(isFileUIPart) as FileUIPart[];
  const textParts = message.parts.filter((part) => part.type === "text");

  return (
    <Message from="user">
      <MessageContent className="gap-3">
        {files.length > 0 ? (
          <Attachments variant="grid">
            {files.map((file, index) => (
              <Attachment
                data={{ ...file, id: `${message.id}-file-${index}` }}
                key={`${message.id}-file-${index}`}
              >
                <AttachmentPreview />
              </Attachment>
            ))}
          </Attachments>
        ) : null}
        {textParts.map((part, index) =>
          part.type === "text" ? (
            <p key={`${message.id}-${index}`} className="whitespace-pre-wrap wrap-anywhere">
              {part.text}
            </p>
          ) : null,
        )}
      </MessageContent>
    </Message>
  );
}

function SecurityNoticeView({
  notice,
  labels,
}: {
  notice: VexaMessage["parts"][number] extends infer P ? (P extends { type: "data-notice"; data: infer D } ? D : never) : never;
  labels: ChatLabels;
}) {
  return (
    <div
      role="status"
      className="flex gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground"
    >
      <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="min-w-0">
        <p className="font-semibold">{labels.securityTitle}</p>
        <p className="text-[13px] leading-snug">{labels.securityBody(notice.tool)}</p>
        <p className="mt-1 line-clamp-2 wrap-anywhere font-mono text-[11px] text-warning" title={notice.excerpt}>
          {notice.excerpt}
        </p>
      </div>
    </div>
  );
}
