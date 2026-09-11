"use client";

import { useState } from "react";
import type { LanguageModelUsage } from "ai";
import { ChevronDownIcon } from "lucide-react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "agentic-ui/ai-elements/attachments";
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
} from "agentic-ui/ai-elements/prompt-input";
import { Button } from "agentic-ui/ui/button";
import { MODELS } from "./constants";

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
}: {
  text: string;
  setText: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  usedTokens: number;
  maxTokens: number;
  usage: LanguageModelUsage;
}) {
  const attachments = usePromptInputAttachments();
  const [modelOpen, setModelOpen] = useState(false);
  const selected = MODELS.find((item) => item.id === model) ?? MODELS[0];

  return (
    <>
      <PromptInputHeader>
        <PromptInputAttachmentsDisplay />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
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
                <ModelSelectorGroup heading="OpenRouter">
                  {MODELS.map((item) => (
                    <ModelSelectorItem
                      key={item.id}
                      onSelect={() => {
                        setModel(item.id);
                        setModelOpen(false);
                      }}
                      value={item.id}
                    >
                      <ModelSelectorLogo provider={item.provider} />
                      <ModelSelectorName>{item.name}</ModelSelectorName>
                    </ModelSelectorItem>
                  ))}
                </ModelSelectorGroup>
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
