export const SUGGESTIONS = [
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
] as const;

export const MODELS = [
  {
    id: "google/gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "google" as const,
    maxTokens: 1_000_000,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (thinking)",
    provider: "google" as const,
    maxTokens: 1_000_000,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic" as const,
    maxTokens: 200_000,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai" as const,
    maxTokens: 128_000,
  },
] as const;

export type ChatModel = (typeof MODELS)[number];
