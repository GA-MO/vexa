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
import { MODELS, type ChatComposerOptions, type ChatLabels, type ChatModel } from "./constants";

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

function PromptInputAttachmentsDisplay({ removeLabel }: { removeLabel: string }) {
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
          <AttachmentRemove label={removeLabel} />
        </Attachment>
      ))}
    </Attachments>
  );
}

function AttachmentMenu({ labels }: { labels: ChatLabels }) {
  return (
    <PromptInputActionMenu>
      <PromptInputActionMenuTrigger aria-label={labels.attach} />
      <PromptInputActionMenuContent>
        <PromptInputActionAddAttachments label={labels.addAttachment} />
        <PromptInputActionAddScreenshot label={labels.takeScreenshot} />
      </PromptInputActionMenuContent>
    </PromptInputActionMenu>
  );
}

function ModelPicker({
  models,
  model,
  setModel,
  labels,
}: {
  models: readonly ChatModel[];
  model: string;
  setModel: (value: string) => void;
  labels: ChatLabels;
}) {
  const [open, setOpen] = useState(false);
  const selected = models.find((item) => item.id === model) ?? models[0];

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
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
      <ModelSelectorContent title={labels.selectModel}>
        <ModelSelectorInput placeholder={labels.searchModels} />
        <ModelSelectorList>
          <ModelSelectorEmpty>{labels.noModels}</ModelSelectorEmpty>
          {groupByProvider(models).map((group) => (
            <ModelSelectorGroup className="flex flex-col gap-0.5" heading={group.label} key={group.label}>
              {group.models.map((item) => (
                <ModelSelectorItem
                  data-checked={item.id === model}
                  key={item.id}
                  onSelect={() => {
                    setModel(item.id);
                    setOpen(false);
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
  );
}

function TokenUsage({
  model,
  usedTokens,
  maxTokens,
  usage,
  labels,
}: {
  model: string;
  usedTokens: number;
  maxTokens: number;
  usage: LanguageModelUsage;
  labels: ChatLabels;
}) {
  return (
    <Context maxTokens={maxTokens} modelId={model} usage={usage} usedTokens={usedTokens}>
      <ContextTrigger aria-label={labels.tokenUsage} />
      <ContextContent>
        <ContextContentHeader />
        <ContextContentBody>
          <ContextInputUsage label={labels.usageInput} />
          <ContextOutputUsage label={labels.usageOutput} />
          <ContextReasoningUsage label={labels.usageReasoning} />
          <ContextCacheUsage label={labels.usageCache} />
        </ContextContentBody>
        <ContextContentFooter label={labels.usageTotalCost} />
      </ContextContent>
    </Context>
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
  labels,
  options,
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
  labels: ChatLabels;
  options: ChatComposerOptions;
}) {
  const attachments = usePromptInputAttachments();
  const modelOptions = models && models.length > 0 ? models : MODELS;
  const showAttachments = options.attachments ?? true;
  const showModelPicker = options.modelPicker ?? modelOptions.length > 1;
  const showTokenUsage = options.tokenUsage ?? true;

  return (
    <>
      {attachments.files.length > 0 ? (
        <PromptInputHeader>
          <PromptInputAttachmentsDisplay removeLabel={labels.removeAttachment} />
        </PromptInputHeader>
      ) : null}
      <PromptInputBody>
        <PromptInputTextarea
          className="min-h-11 pt-3"
          onChange={(event) => setText(event.target.value)}
          placeholder={labels.placeholder}
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          {showAttachments ? <AttachmentMenu labels={labels} /> : null}
          {showModelPicker ? <ModelPicker labels={labels} model={model} models={modelOptions} setModel={setModel} /> : null}
          {showTokenUsage ? (
            <TokenUsage labels={labels} maxTokens={maxTokens} model={model} usage={usage} usedTokens={usedTokens} />
          ) : null}
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!text.trim() && attachments.files.length === 0}
          status={status}
          stopLabel={labels.stop}
          submitLabel={labels.send}
        />
      </PromptInputFooter>
    </>
  );
}
