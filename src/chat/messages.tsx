"use client";

import { useJsonRenderMessage } from "@json-render/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronDownIcon,
  HandIcon,
  MousePointerClickIcon,
  PaperclipIcon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react";
import {
  SPEC_DATA_PART_TYPE,
  reasoningSeconds as stampedSeconds,
  type VexaMessage,
} from "vexa/protocol";
import { DEFAULT_LABELS, humanizeToolName, type ChatLabels, type ChatStepsDisplay } from "./constants";
import { normalizeSpec } from "vexa/core";
import { SpecView, parseActionMessage, useVexaHostContext, type ToolCallDescription } from "vexa/react";
import { ADMIN_TOOLS, describeSteps, type RunResult, type Step, type TraceItem } from "vexa/admin";
import { specPartsFor } from "./spec-continuation";
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

const MAX_APPROVAL_DETAILS = 6;
const MAX_DETAIL_CHARS = 120;

function readableValue(value: unknown): string | null {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return String(value);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.length > MAX_DETAIL_CHARS ? `${value.slice(0, MAX_DETAIL_CHARS - 1)}…` : value;
}

/** What a pending tool call changes, in the words the input already uses. Nested objects stay in the collapsed tool block. */
function defaultDetails(input: unknown): Array<{ label: string; value: string }> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return [];
  return Object.entries(input as Record<string, unknown>)
    .map(([key, value]) => ({ label: humanizeToolName(key), value: readableValue(value) }))
    .filter((detail): detail is { label: string; value: string } => detail.value !== null)
    .slice(0, MAX_APPROVAL_DETAILS);
}

function ApprovalDetails({ details }: { details: Array<{ label: string; value: string }> }) {
  if (details.length === 0) return null;
  return (
    <dl className="mt-2 flex flex-col gap-1 text-xs">
      {details.map((detail) => (
        <div key={detail.label} className="flex min-w-0 items-baseline justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{detail.label}</dt>
          <dd className="min-w-0 wrap-anywhere text-right font-medium">{detail.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ToolApproval({
  part,
  onApproval,
  labels,
  description,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
  description: ToolCallDescription | null;
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
        <ConfirmationRequest>
          {description ? (description.question ?? description.title) : labels.approveTool(toolName)}
          <ApprovalDetails details={description?.details ?? defaultDetails("input" in part ? part.input : null)} />
        </ConfirmationRequest>
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

function awaitsApproval(part: ToolUIPart | DynamicToolUIPart): boolean {
  return "approval" in part && Boolean(part.approval);
}

function isRunResult(value: unknown): value is RunResult {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray((value as { trace?: unknown }).trace);
}

function adminRunResult(part: ToolUIPart | DynamicToolUIPart): RunResult | null {
  if (getToolName(part) !== ADMIN_TOOLS.run || !("output" in part)) return null;
  const output = part.output as { data?: unknown } | undefined;
  return isRunResult(output?.data) ? output.data : null;
}

function stepSentence(item: TraceItem, index: number, steps: Step[]): string {
  const step = steps[index];
  if (step) return describeSteps([step])[0];
  return item.action;
}

function AdminTraceRow({ item, sentence }: { item: TraceItem; sentence: string }) {
  const Icon = item.ok ? CheckIcon : XIcon;
  return (
    <li className="flex min-w-0 items-start gap-2">
      <Icon className={item.ok ? "mt-0.5 size-3.5 shrink-0 text-success" : "mt-0.5 size-3.5 shrink-0 text-danger"} />
      <span className="min-w-0 wrap-anywhere">
        {sentence}
        {item.error ? (
          <span className="block text-danger">
            {item.error}
            {item.detail ? `: ${item.detail}` : ""}
          </span>
        ) : null}
      </span>
    </li>
  );
}

const WAITING_FOR_PAGE_CONFIRM = "Waiting for you to confirm on the page";

function AdminTraceStopped() {
  return (
    <li className="flex min-w-0 items-start gap-2 text-muted-foreground">
      <HandIcon className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0 wrap-anywhere">{WAITING_FOR_PAGE_CONFIRM}</span>
    </li>
  );
}

function AdminTrace({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const result = adminRunResult(part);
  if (!result) return null;
  const steps = "input" in part && part.input ? ((part.input as { steps?: Step[] }).steps ?? []) : [];
  return (
    <ol className="flex min-w-0 flex-col gap-1 px-3 py-2 text-xs text-foreground">
      {result.trace.map((item, index) => (
        <AdminTraceRow key={index} item={item} sentence={stepSentence(item, index, steps)} />
      ))}
      {result.stopped === "confirmation" ? <AdminTraceStopped /> : null}
    </ol>
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
      <Tool defaultOpen={part.state !== "output-available" && !awaitsApproval(part)}>
        {part.type === "dynamic-tool" ? (
          <ToolHeader
            state={part.state}
            statusLabel={labels.toolState(part.state)}
            title={toolName}
            toolName={toolName}
            type="dynamic-tool"
          />
        ) : (
          <ToolHeader state={part.state} statusLabel={labels.toolState(part.state)} title={toolName} type={part.type} />
        )}
        <ToolContent>
          <AdminTrace part={part} />
          {"input" in part && part.input != null ? (
            <ToolInput input={part.input} title={labels.toolInput} />
          ) : null}
          <ToolOutput
            errorText={"errorText" in part ? part.errorText : undefined}
            output={"output" in part ? part.output : undefined}
            title={labels.toolOutput}
          />
        </ToolContent>
      </Tool>
    </div>
  );
}

/** Approvals always render beside the reply, never inside the process block: collapsing "Thinking" must not hide a decision. */
function PendingApprovals({
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
        <HiddenApproval key={part.toolCallId} labels={labels} onApproval={onApproval} part={part} />
      ))}
    </div>
  );
}

function HiddenApproval({
  part,
  onApproval,
  labels,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
}) {
  const host = useVexaHostContext();
  const input = "input" in part ? part.input : null;
  const approval = "approval" in part ? (part.approval as { id: string; approved?: boolean } | undefined) : undefined;
  const hosted =
    host?.renderApproval && approval && onApproval
      ? host.renderApproval({
          tool: getToolName(part),
          input,
          state: part.state,
          approved: approval.approved ?? null,
          approve: () => onApproval(approval.id, true),
          reject: () => onApproval(approval.id, false),
        })
      : null;
  if (hosted) return hosted;
  const describe = host?.describeToolCall ?? null;
  const description = describe && input != null ? describe(getToolName(part), input) : null;
  return <ToolApproval description={description} labels={labels} onApproval={onApproval} part={part} />;
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

  return (
    <ChainOfThought onOpenChange={setOpen} open={open}>
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
              label={humanizeToolName(getToolName(part))}
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

function historyThrough(messages: VexaMessage[] | undefined, messageId: string): VexaMessage[] | undefined {
  if (!messages) return messages;
  const index = messages.findIndex((entry) => entry.id === messageId);
  return index < 0 ? messages : messages.slice(0, index + 1);
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
  const { spec: rawSpec, hasSpec } = useJsonRenderMessage(specPartsFor(message, messages));
  const spec = useMemo(() => normalizeSpec(rawSpec), [rawSpec]);
  const history = useMemo(() => historyThrough(messages, message.id), [messages, message.id]);
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
          messages={history}
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
        messages={history}
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
            <SourcesTrigger count={sourceParts.length}>
              <p className="font-medium">{labels.usedSources(sourceParts.length)}</p>
              <ChevronDownIcon className="size-4" />
            </SourcesTrigger>
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

        {toolParts.length > 0 ? (
          <PendingApprovals labels={labels} onApproval={onApproval} toolParts={toolParts} />
        ) : null}

        {showLoader ? (
          <Shimmer className="text-sm" duration={1.2}>
            {labels.thinking}
          </Shimmer>
        ) : null}
      </MessageContent>
    </Message>
  );
}

/** A button press reads as what the user did, not as the payload it sent: nested values stay out of the bubble. */
function ActionMessage({ action, labels }: { action: { name: string; input: Record<string, unknown> }; labels: ChatLabels }) {
  const describe = useVexaHostContext()?.describeToolCall ?? null;
  const description = describe ? describe(action.name, action.input) : null;
  const fields = description?.details ?? defaultDetails(action.input);
  return (
    <Message from="user">
      <MessageContent className="gap-1.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <MousePointerClickIcon className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>{description ? description.title : labels.buttonPressed(action.name)}</span>
        </span>
        {fields.length > 0 ? (
          <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {fields.map((field) => (
              <div key={field.label} className="flex min-w-0 gap-1 wrap-anywhere">
                <dt className="shrink-0 opacity-70">{field.label}</dt>
                <dd className="font-medium">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </MessageContent>
    </Message>
  );
}

function forwardedAction(message: VexaMessage) {
  const textParts = message.parts.filter((part) => part.type === "text");
  if (message.parts.length !== 1 || textParts.length !== 1) return null;
  return parseActionMessage(textParts[0].text);
}

export function UserMessage({ message, labels = DEFAULT_LABELS }: { message: VexaMessage; labels?: ChatLabels }) {
  const files = message.parts.filter(isFileUIPart) as FileUIPart[];
  const textParts = message.parts.filter((part) => part.type === "text");
  const action = forwardedAction(message);
  if (action) return <ActionMessage action={action} labels={labels} />;

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
