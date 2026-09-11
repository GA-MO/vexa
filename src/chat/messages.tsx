"use client";

import { useJsonRenderMessage } from "@json-render/react";
import {
  getToolName,
  isFileUIPart,
  isToolUIPart,
  type FileUIPart,
} from "ai";
import {
  CheckIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";
import {
  SPEC_DATA_PART_TYPE,
  type AgenticMessage,
} from "agentic-ui/protocol";
import { SpecView } from "agentic-ui/react";
import {
  Attachment,
  AttachmentPreview,
  Attachments,
} from "agentic-ui/ai-elements/attachments";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "agentic-ui/ai-elements/chain-of-thought";
import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "agentic-ui/ai-elements/confirmation";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationSource,
} from "agentic-ui/ai-elements/inline-citation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "agentic-ui/ai-elements/message";
import {
  Plan,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "agentic-ui/ai-elements/plan";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "agentic-ui/ai-elements/reasoning";
import { Shimmer } from "agentic-ui/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "agentic-ui/ai-elements/sources";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "agentic-ui/ai-elements/task";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "agentic-ui/ai-elements/tool";

function ToolPartView({
  part,
  messageId,
  index,
  onApproval,
}: {
  part: AgenticMessage["parts"][number];
  messageId: string;
  index: number;
  onApproval?: (id: string, approved: boolean) => void;
}) {
  if (!isToolUIPart(part)) return null;

  const toolName = getToolName(part);
  const approval =
    "approval" in part
      ? (part.approval as { id: string; approved?: boolean } | undefined)
      : undefined;

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

      {approval && onApproval ? (
        <Confirmation approval={approval} state={part.state}>
          <ConfirmationTitle>
            <ConfirmationRequest>
              Approve running <code>{toolName}</code>?
            </ConfirmationRequest>
            <ConfirmationAccepted>
              <CheckIcon className="size-4" />
              <span>Approved</span>
            </ConfirmationAccepted>
            <ConfirmationRejected>
              <XIcon className="size-4" />
              <span>Rejected</span>
            </ConfirmationRejected>
          </ConfirmationTitle>
          <ConfirmationActions>
            <ConfirmationAction
              onClick={() => onApproval(approval.id, false)}
              variant="outline"
            >
              Reject
            </ConfirmationAction>
            <ConfirmationAction
              onClick={() => onApproval(approval.id, true)}
              variant="default"
            >
              Approve
            </ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      ) : null}
    </div>
  );
}

export function AssistantMessage({
  message,
  isLast,
  isStreaming,
  onApproval,
  messages,
}: {
  message: AgenticMessage;
  isLast: boolean;
  isStreaming: boolean;
  onApproval?: (id: string, approved: boolean) => void;
  messages?: AgenticMessage[];
}) {
  const { spec, hasSpec } = useJsonRenderMessage(message.parts);
  const sourceParts = message.parts.filter(
    (part) => part.type === "source-url" || part.type === "source-document",
  );
  const sourceUrls = sourceParts
    .filter((part) => part.type === "source-url")
    .map((part) => part.url);
  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning",
  );
  const toolParts = message.parts.filter(isToolUIPart);
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

  if (processParts.length > 0) {
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

        {processParts.length > 0 ? (
          <div className="space-y-3">
            <ChainOfThought defaultOpen={isLast && isStreaming}>
              <ChainOfThoughtHeader>Chain of Thought</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {reasoningParts.map((part, index) => (
                  <ChainOfThoughtStep
                    key={`${message.id}-cot-reasoning-${index}`}
                    label="Reasoning"
                    status={part.state === "streaming" ? "active" : "complete"}
                  >
                    <Reasoning
                      className="w-full"
                      isStreaming={part.state === "streaming"}
                    >
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
                      messageId={message.id}
                      onApproval={onApproval}
                      part={part}
                    />
                  </ChainOfThoughtStep>
                ))}
              </ChainOfThoughtContent>
            </ChainOfThought>

            {toolParts.length > 0 ? (
              <Plan defaultOpen isStreaming={isLast && isStreaming}>
                <PlanHeader>
                  <div className="space-y-1">
                    <PlanTitle>Working plan</PlanTitle>
                    <PlanDescription>
                      Tools and steps for this reply
                    </PlanDescription>
                  </div>
                  <PlanTrigger />
                </PlanHeader>
                <PlanContent>
                  <Task defaultOpen>
                    <TaskTrigger title={`${toolParts.length} tasks`} />
                    <TaskContent>
                      {toolParts.map((part, index) => (
                        <TaskItem key={`${message.id}-task-${index}`}>
                          {getToolName(part)} — {part.state}
                        </TaskItem>
                      ))}
                    </TaskContent>
                  </Task>
                </PlanContent>
              </Plan>
            ) : null}
          </div>
        ) : null}

        {content}

        {showLoader ? (
          <Shimmer className="text-sm" duration={1.2}>
            Thinking...
          </Shimmer>
        ) : null}
      </MessageContent>
    </Message>
  );
}

export function UserMessage({ message }: { message: AgenticMessage }) {
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
            <p key={`${message.id}-${index}`} className="whitespace-pre-wrap">
              {part.text}
            </p>
          ) : null,
        )}
      </MessageContent>
    </Message>
  );
}
