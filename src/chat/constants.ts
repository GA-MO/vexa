import type { ToolUIPart } from "ai";

export type ChatSuggestion = { label: string; prompt: string };

/** How reasoning and tool calls appear: a collapsible steps block, or hidden behind the thinking indicator (approval cards always show). */
export type ChatStepsDisplay = "collapsible" | "hidden";

/** Tool call states as the AI SDK reports them; `labels.toolState` names each one. */
export type ChatToolState = ToolUIPart["state"];

/** Which composer controls show besides the textarea and send button. `modelPicker` defaults to showing only when more than one model is available. */
export type ChatComposerOptions = {
  attachments?: boolean;
  modelPicker?: boolean;
  tokenUsage?: boolean;
};

export type ChatLabels = {
  emptyTitle: string;
  emptyDescription: string;
  thinking: string;
  reasoning: string;
  thoughtFor: (seconds: number) => string;
  steps: (count: number) => string;
  approveTool: (tool: string) => string;
  approved: string;
  rejected: string;
  approve: string;
  reject: string;
  runOnPage: (tool: string) => string;
  runSteps: (count: number) => string;
  run: string;
  cancel: string;
  restore: string;
  restoreTooltip: string;
  startOver: string;
  closeChat: string;
  openAssistant: string;
  closeAssistant: string;
  queued: string;
  removeQueued: string;
  sentWithAttachments: string;
  attachment: string;
  securityTitle: string;
  securityBody: (tool: string) => string;
  buttonPressed: (tool: string) => string;
  placeholder: string;
  send: string;
  stop: string;
  attach: string;
  addAttachment: string;
  takeScreenshot: string;
  removeAttachment: string;
  selectModel: string;
  searchModels: string;
  noModels: string;
  tokenUsage: string;
  usageInput: string;
  usageOutput: string;
  usageReasoning: string;
  usageCache: string;
  usageTotalCost: string;
  toolInput: string;
  toolOutput: string;
  toolState: (state: ChatToolState) => string;
  usedSources: (count: number) => string;
  carouselHint: string;
  carouselPrevious: string;
  carouselNext: string;
};

const DEFAULT_TOOL_STATES: Record<ChatToolState, string> = {
  "input-streaming": "Pending",
  "input-available": "Running",
  "approval-requested": "Awaiting approval",
  "approval-responded": "Responded",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

/** `book_room` → `Book room`, `fixtures__write_file` → `Fixtures write file`. */
export function humanizeToolName(tool: string): string {
  const words = tool.replace(/__/g, " ").replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const DEFAULT_LABELS: ChatLabels = {
  emptyTitle: "Ask anything. Get UI back.",
  emptyDescription: "Stream an answer, or generate cards, metrics, and tables in place.",
  thinking: "Thinking...",
  reasoning: "Reasoning",
  thoughtFor: (seconds) => (seconds === 1 ? "Thought for 1 second" : `Thought for ${seconds} seconds`),
  steps: (count) => (count === 1 ? "1 step" : `${count} steps`),
  approveTool: (tool) => `Approve running ${tool}?`,
  approved: "Approved",
  rejected: "Rejected",
  approve: "Approve",
  reject: "Reject",
  runOnPage: (tool) => `Run ${tool} on this page?`,
  runSteps: (count) => (count === 1 ? "Run 1 step on this page?" : `Run ${count} steps on this page?`),
  run: "Run",
  cancel: "Cancel",
  restore: "Restore",
  restoreTooltip: "Restore conversation to this point",
  startOver: "Start over",
  closeChat: "Close chat",
  openAssistant: "Open assistant",
  closeAssistant: "Close assistant",
  queued: "Queued",
  removeQueued: "Remove queued message",
  sentWithAttachments: "Sent with attachments",
  attachment: "Attachment",
  securityTitle: "Suspicious text in tool data",
  securityBody: (tool) => `Data returned by ${tool} contained instructions aimed at the assistant. They were ignored and tools that change data were disabled for this reply.`,
  buttonPressed: (tool) => humanizeToolName(tool),
  placeholder: "Ask for an answer or a UI...",
  send: "Send",
  stop: "Stop",
  attach: "Attach",
  addAttachment: "Add photos or files",
  takeScreenshot: "Take screenshot",
  removeAttachment: "Remove attachment",
  selectModel: "Select a model",
  searchModels: "Search models...",
  noModels: "No models found.",
  tokenUsage: "Context usage",
  usageInput: "Input",
  usageOutput: "Output",
  usageReasoning: "Reasoning",
  usageCache: "Cache",
  usageTotalCost: "Total cost",
  toolInput: "Parameters",
  toolOutput: "Result",
  toolState: (state) => DEFAULT_TOOL_STATES[state],
  usedSources: (count) => (count === 1 ? "Used 1 source" : `Used ${count} sources`),
  carouselHint: "Swipe or drag to scroll freely",
  carouselPrevious: "Scroll previous",
  carouselNext: "Scroll next",
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
};

export const SUGGESTIONS: readonly ChatSuggestion[] = [
  {
    label: "KPI dashboard",
    prompt: "Build a quarterly sales dashboard with three metrics",
  },
  {
    label: "Compare plans",
    prompt: "Compare the Free, Pro and Enterprise plans in a table",
  },
  {
    label: "Onboarding steps",
    prompt: "Summarize the new-hire onboarding steps as a list and a card",
  },
  {
    label: "Plain answer",
    prompt: "Explain generative UI in a few sentences, without building any UI",
  },
];

export const MODELS: readonly ChatModel[] = [
  {
    id: "google/gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "google",
    maxTokens: 1_000_000,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (thinking)",
    provider: "google",
    maxTokens: 1_000_000,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    maxTokens: 200_000,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    maxTokens: 128_000,
  },
];
