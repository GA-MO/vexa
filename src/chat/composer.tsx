"use client";

import { useState } from "react";
import type { LanguageModelUsage } from "ai";
import { ChevronDownIcon } from "lucide-react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "vexa/ai-elements/attachments";
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
} from "vexa/ai-elements/context";
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
} from "vexa/ai-elements/model-selector";
import {
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "vexa/ai-elements/prompt-input";
import { Button } from "vexa/ui/button";
import { MODELS, type ChatModel } from "./constants";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  meta: "Meta",
  mistral: "Mistral",
  xai: "xAI",
};

function providerLabel(provider: string) {
  return PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

function groupByProvider(models: readonly ChatModel[]) {
  const groups = new Map<string, ChatModel[]>();
  for (const item of models) {
    const label = providerLabel(item.provider);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups].map(([label, items]) => ({ label, models: items }));
}

function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((file) => (
        <Attachment
          data={file}
          key={file.id}
          onRemove={() => attachments.remove(file.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

export function ChatComposer({
  text,
  setText,
  model,
  setModel,
  status,
  usedTokens,
  maxTokens,
  usage,
  models,
}: {
  text: string;
  setText: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  usedTokens: number;
  maxTokens: number;
  usage: LanguageModelUsage;
  models?: readonly ChatModel[];
}) {
  const attachments = usePromptInputAttachments();
  const [modelOpen, setModelOpen] = useState(false);
  const modelOptions = models && models.length > 0 ? models : MODELS;
  const selected = modelOptions.find((item) => item.id === model) ?? modelOptions[0];

  return (
    <>
      {attachments.files.length > 0 ? (
        <PromptInputHeader>
          <PromptInputAttachmentsDisplay />
        </PromptInputHeader>
      ) : null}
      <PromptInputBody>
        <PromptInputTextarea
          className="min-h-11 pt-3"
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask for an answer or a UI..."
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
              <PromptInputActionAddScreenshot />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <ModelSelector onOpenChange={setModelOpen} open={modelOpen}>
            <ModelSelectorTrigger
              render={
                <Button
                  className="max-w-[9.5rem] gap-1.5 px-2"
                  size="sm"
                  type="button"
                  variant="ghost"
                />
              }
            >
              <ModelSelectorLogo provider={selected.provider} />
              <ModelSelectorName className="truncate text-xs">
                {selected.name}
              </ModelSelectorName>
              <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
            </ModelSelectorTrigger>
            <ModelSelectorContent title="Select a model">
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                {groupByProvider(modelOptions).map((group) => (
                  <ModelSelectorGroup className="flex flex-col gap-0.5" heading={group.label} key={group.label}>
                    {group.models.map((item) => (
                      <ModelSelectorItem
                        data-checked={item.id === model}
                        key={item.id}
                        onSelect={() => {
                          setModel(item.id);
                          setModelOpen(false);
                        }}
                        value={item.id}
                      >
                        <ModelSelectorLogo provider={item.provider as never} />
                        <ModelSelectorName>{item.name}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                ))}
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>

          <Context
            maxTokens={maxTokens}
            modelId={model}
            usage={usage}
            usedTokens={usedTokens}
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
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!text.trim() && attachments.files.length === 0}
          status={status}
        />
      </PromptInputFooter>
    </>
  );
}
