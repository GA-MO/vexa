"use client";

import { useJsonRenderMessage } from "@json-render/react";
import { useState } from "react";
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

function ProcessSteps({
  message,
  isStreaming,
  onApproval,
  labels,
  reasoningParts,
  toolParts,
}: {
  message: VexaMessage;
  isStreaming: boolean;
  onApproval?: (id: string, approved: boolean) => void;
  labels: ChatLabels;
  reasoningParts: ReasoningUIPart[];
  toolParts: Array<ToolUIPart | DynamicToolUIPart>;
}) {
  const [open, setOpen] = useState(false);
  const awaitingApproval = toolParts.some((part) => part.state === "approval-requested");
  const stepCount = reasoningParts.length + toolParts.length;

  return (
    <ChainOfThought onOpenChange={setOpen} open={open || awaitingApproval}>
      <ChainOfThoughtHeader>
        {isStreaming ? <Shimmer duration={1.2}>{labels.thinking}</Shimmer> : labels.steps(stepCount)}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {reasoningParts.map((part, index) => (
          <ChainOfThoughtStep
            key={`${message.id}-cot-reasoning-${index}`}
            label={labels.reasoning}
            status={part.state === "streaming" ? "active" : "complete"}
          >
            <Reasoning className="w-full" isStreaming={part.state === "streaming"}>
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          </ChainOfThoughtStep>
        ))}
        {toolParts.map((part, index) => (
          <ChainOfThoughtStep
            key={`${message.id}-cot-tool-${index}`}
            label={getToolName(part)}
            status={
              part.state === "output-available" ||
              part.state === "output-error" ||
              part.state === "output-denied"
                ? "complete"
                : "active"
            }
          >
            <ToolPartView
              index={index}
              labels={labels}
              messageId={message.id}
              onApproval={onApproval}
              part={part}
            />
          </ChainOfThoughtStep>
        ))}
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
  const reasoningParts = message.parts.filter(
    (part): part is ReasoningUIPart => part.type === "reasoning",
  );
  const toolParts = message.parts.filter(isToolUIPart);
  const noticeParts = message.parts.filter((part) => part.type === "data-notice");
  const processParts = [...reasoningParts, ...toolParts];

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

        {processParts.length > 0 && steps === "collapsible" ? (
          <ProcessSteps
            isStreaming={isLast && isStreaming}
            labels={labels}
            message={message}
            onApproval={onApproval}
            reasoningParts={reasoningParts}
            toolParts={toolParts}
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
