"use client";

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "agentic-ui/ui/button";
import {
  Attachment,
  AttachmentInfo,
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
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "agentic-ui/ai-elements/checkpoint";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "agentic-ui/ai-elements/code-block";
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
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from "agentic-ui/ai-elements/context";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationSource,
  InlineCitationText,
} from "agentic-ui/ai-elements/inline-citation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "agentic-ui/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "agentic-ui/ai-elements/model-selector";
import {
  Plan,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "agentic-ui/ai-elements/plan";
import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemDescription,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from "agentic-ui/ai-elements/queue";
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
import { Suggestion, Suggestions } from "agentic-ui/ai-elements/suggestion";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "agentic-ui/ai-elements/task";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "agentic-ui/ai-elements/tool";
import { MODELS, SUGGESTIONS } from "agentic-ui/chat";

function ChromeBlock({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{note}</p>
      </div>
      {children}
    </div>
  );
}

export function ChatChromeSamples() {
  return (
    <div className="space-y-5 rounded-[1.35rem] border border-border/70 bg-card p-4 sm:p-5">
      <ChromeBlock
        title="Message · user / assistant"
        note="Bubble chrome for turns in the overlay."
      >
        <Message from="user">
          <MessageContent>
            <p>สร้าง dashboard สรุปยอดขายรายไตรมาส พร้อม metric 3 ตัว</p>
          </MessageContent>
        </Message>
        <div className="mt-3">
          <Message from="assistant">
            <MessageContent className="w-full max-w-none gap-2 bg-transparent px-0 py-0">
              <MessageResponse>
                ได้เลย — จะจัด Grid ของ Metric แล้วตามด้วย Table เปรียบเทียบแผน
              </MessageResponse>
            </MessageContent>
          </Message>
        </div>
      </ChromeBlock>

      <ChromeBlock
        title="Attachments"
        note="User file chips shown above the composer."
      >
        <Attachments variant="inline">
          <Attachment
            data={{
              id: "att-1",
              type: "file",
              filename: "q2-sales.csv",
              mediaType: "text/csv",
              url: "#",
            }}
          >
            <AttachmentPreview />
            <AttachmentInfo />
          </Attachment>
          <Attachment
            data={{
              id: "att-2",
              type: "file",
              filename: "dashboard.png",
              mediaType: "image/png",
              url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=60",
            }}
          >
            <AttachmentPreview />
            <AttachmentInfo />
          </Attachment>
        </Attachments>
      </ChromeBlock>

      <ChromeBlock
        title="Suggestions"
        note="Quick prompts under an empty conversation."
      >
        <Suggestions>
          {SUGGESTIONS.map((item) => (
            <Suggestion key={item.label} suggestion={item.label} />
          ))}
        </Suggestions>
      </ChromeBlock>

      <ChromeBlock
        title="Shimmer"
        note="Loading placeholder while the first tokens arrive."
      >
        <div className="text-sm text-slate-700">
          <Shimmer>กำลังคิดและจัด UI…</Shimmer>
        </div>
      </ChromeBlock>

      <ChromeBlock
        title="Reasoning"
        note="Collapsible model thinking block."
      >
        <Reasoning defaultOpen>
          <ReasoningTrigger />
          <ReasoningContent>
            User wants a quarterly sales dashboard. Prefer Grid of Metrics, then
            a comparison Table if plans are mentioned. Keep the UI compact for
            the overlay panel.
          </ReasoningContent>
        </Reasoning>
      </ChromeBlock>

      <ChromeBlock
        title="Chain of thought"
        note="Step timeline for multi-stage agent work."
      >
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Chain of thought</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              icon={SearchIcon}
              label="Parse request"
              description="Dashboard + 3 metrics + optional table"
              status="complete"
            />
            <ChainOfThoughtStep
              label="Fetch metrics"
              description="lookup_metrics for Q1–Q3"
              status="complete"
            />
            <ChainOfThoughtStep
              label="Emit SpecStream"
              description="Card → Grid → Metric ×3 → Table"
              status="active"
            />
            <ChainOfThoughtStep
              label="Polish copy"
              description="Thai prose + compact layout"
              status="pending"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      </ChromeBlock>

      <ChromeBlock title="Plan" note="High-level plan card the agent can stream.">
        <Plan defaultOpen>
          <PlanHeader>
            <div>
              <PlanTitle>Build sales dashboard</PlanTitle>
              <PlanDescription>
                Collect metrics, compose catalog UI, then cite sources.
              </PlanDescription>
            </div>
            <PlanTrigger />
          </PlanHeader>
          <PlanContent>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-600">
              <li>Call lookup_metrics for TH region</li>
              <li>Render Grid of 3 Metrics</li>
              <li>Add plan comparison Table</li>
            </ol>
          </PlanContent>
        </Plan>
      </ChromeBlock>

      <ChromeBlock title="Task" note="Collapsible task with file chips.">
        <Task defaultOpen>
          <TaskTrigger title="Gather sales inputs" />
          <TaskContent>
            <TaskItem>Read Q2 memo and pricing sheet</TaskItem>
            <TaskItem>
              Attachments: <TaskItemFile>q2-sales.csv</TaskItemFile>{" "}
              <TaskItemFile>pricing.xlsx</TaskItemFile>
            </TaskItem>
          </TaskContent>
        </Task>
      </ChromeBlock>

      <ChromeBlock
        title="Tool"
        note="Tool call header with input / output panels."
      >
        <Tool defaultOpen>
          <ToolHeader
            state="output-available"
            title="lookup_metrics"
            type="tool-lookup_metrics"
          />
          <ToolContent>
            <ToolInput input={{ range: "2026-Q1..Q3", region: "TH" }} />
            <ToolOutput
              errorText={undefined}
              output={{ revenue: [1.2, 1.5, 1.1], currency: "THB" }}
            />
          </ToolContent>
        </Tool>
      </ChromeBlock>

      <ChromeBlock
        title="Confirmation"
        note="Approve / reject a sensitive tool call."
      >
        <Confirmation
          approval={{ id: "approval-1" }}
          state="approval-requested"
        >
          <ConfirmationTitle>
            <ConfirmationRequest>
              Approve running <code>export_report</code>?
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
            <ConfirmationAction type="button" variant="outline">
              Reject
            </ConfirmationAction>
            <ConfirmationAction type="button" variant="default">
              Approve
            </ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      </ChromeBlock>

      <ChromeBlock
        title="Sources"
        note="Collapsible source list under an assistant turn."
      >
        <Sources>
          <SourcesTrigger count={2} />
          <SourcesContent>
            <Source href="https://example.com/q2" title="Q2 sales memo" />
            <Source href="https://example.com/plans" title="Pricing sheet" />
          </SourcesContent>
        </Sources>
      </ChromeBlock>

      <ChromeBlock
        title="Inline citation"
        note="Hover citation chip next to prose."
      >
        <Message from="assistant">
          <MessageContent className="w-full max-w-none gap-2 bg-transparent px-0 py-0">
            <p className="text-sm leading-relaxed text-slate-700">
              <InlineCitation>
                <InlineCitationText>
                  Revenue grew 11% in Q2
                </InlineCitationText>
                <InlineCitationCard>
                  <InlineCitationCardTrigger
                    sources={[
                      "https://example.com/q2",
                      "https://example.com/plans",
                    ]}
                  />
                  <InlineCitationCardBody>
                    <InlineCitationSource
                      description="Internal memo"
                      title="Q2 sales memo"
                      url="https://example.com/q2"
                    />
                    <InlineCitationSource
                      description="Pricing reference"
                      title="Pricing sheet"
                      url="https://example.com/plans"
                    />
                  </InlineCitationCardBody>
                </InlineCitationCard>
              </InlineCitation>
              .
            </p>
          </MessageContent>
        </Message>
      </ChromeBlock>

      <ChromeBlock
        title="Code block"
        note="Syntax-highlighted snippet inside chat."
      >
        <CodeBlock
          code={`import { AgenticChatOverlay } from "agentic-ui/chat";

export function App() {
  return <AgenticChatOverlay api="/api/chat" />;
}`}
          language="tsx"
        >
          <CodeBlockHeader>
            <CodeBlockTitle>overlay.tsx</CodeBlockTitle>
            <CodeBlockCopyButton />
          </CodeBlockHeader>
        </CodeBlock>
      </ChromeBlock>

      <ChromeBlock
        title="Checkpoint"
        note="Restore point between conversation segments."
      >
        <Checkpoint>
          <CheckpointIcon />
          <CheckpointTrigger tooltip="Restore to this point">
            Checkpoint · after metrics tool
          </CheckpointTrigger>
        </Checkpoint>
      </ChromeBlock>

      <ChromeBlock
        title="Queue"
        note="Pending todos / queued follow-ups near the composer."
      >
        <Queue>
          <QueueSection defaultOpen>
            <QueueSectionTrigger>
              <QueueSectionLabel count={3} label="Queued" />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                <QueueItem>
                  <div className="flex items-start gap-2">
                    <QueueItemIndicator />
                    <div className="min-w-0 flex-1">
                      <QueueItemContent>Compare Free vs Pro</QueueItemContent>
                      <QueueItemDescription>
                        Table answer after dashboard
                      </QueueItemDescription>
                    </div>
                  </div>
                </QueueItem>
                <QueueItem>
                  <div className="flex items-start gap-2">
                    <QueueItemIndicator completed />
                    <div className="min-w-0 flex-1">
                      <QueueItemContent completed>
                        Fetch Q2 metrics
                      </QueueItemContent>
                    </div>
                  </div>
                </QueueItem>
                <QueueItem>
                  <div className="flex items-start gap-2">
                    <QueueItemIndicator />
                    <div className="min-w-0 flex-1">
                      <QueueItemContent>
                        Draft onboarding checklist
                      </QueueItemContent>
                    </div>
                  </div>
                </QueueItem>
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        </Queue>
      </ChromeBlock>

      <ChromeBlock
        title="Context usage"
        note="Token / context meter in the composer toolbar."
      >
        <Context
          maxTokens={1_000_000}
          modelId="google/gemini-3.1-flash-lite"
          usedTokens={128_400}
          usage={{
            inputTokens: 96_000,
            outputTokens: 24_000,
            totalTokens: 128_400,
            reasoningTokens: 8_400,
            cachedInputTokens: 12_000,
            inputTokenDetails: {
              noCacheTokens: 84_000,
              cacheReadTokens: 12_000,
              cacheWriteTokens: 0,
            },
            outputTokenDetails: {
              textTokens: 15_600,
              reasoningTokens: 8_400,
            },
          }}
        >
          <ContextTrigger />
          <ContextContent>
            <ContextContentHeader />
            <ContextContentBody>
              <ContextInputUsage />
              <ContextOutputUsage />
              <ContextReasoningUsage />
              <ContextCacheUsage />
            </ContextContentBody>
            <ContextContentFooter />
          </ContextContent>
        </Context>
      </ChromeBlock>

      <ChromeBlock
        title="Model selector"
        note="Composer model picker (same list as live chat)."
      >
        <ModelSelector>
          <ModelSelectorTrigger
            render={
              <Button
                className="gap-1.5 px-2"
                size="sm"
                type="button"
                variant="outline"
              />
            }
          >
            <ModelSelectorLogo provider="google" />
            <ModelSelectorName>Gemini 3.1 Flash Lite</ModelSelectorName>
          </ModelSelectorTrigger>
          <ModelSelectorContent title="Select model">
            <ModelSelectorInput placeholder="Search models…" />
            <ModelSelectorList>
              <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
              <ModelSelectorGroup heading="OpenRouter">
                {MODELS.map((model) => (
                  <ModelSelectorItem key={model.id} value={model.id}>
                    <ModelSelectorLogo provider={model.provider} />
                    <ModelSelectorName>{model.name}</ModelSelectorName>
                  </ModelSelectorItem>
                ))}
              </ModelSelectorGroup>
            </ModelSelectorList>
          </ModelSelectorContent>
        </ModelSelector>
      </ChromeBlock>
    </div>
  );
}
