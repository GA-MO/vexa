export type ChatSuggestion = { label: string; prompt: string };

/** How reasoning and tool calls appear: a collapsible steps block, or hidden behind the thinking indicator (approval cards always show). */
export type ChatStepsDisplay = "collapsible" | "hidden";

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
};

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
    prompt: "สร้าง dashboard สรุปยอดขายรายไตรมาส พร้อม metric 3 ตัว",
  },
  {
    label: "Compare plans",
    prompt: "เปรียบเทียบแผน Free / Pro / Enterprise เป็นตาราง",
  },
  {
    label: "Onboarding steps",
    prompt: "สรุปขั้นตอน onboard พนักงานใหม่เป็น list และ card",
  },
  {
    label: "Plain answer",
    prompt: "อธิบาย Generative UI สั้น ๆ โดยไม่ต้องสร้าง UI",
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
