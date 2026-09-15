import type { Spec } from "vexa/protocol";
import type { MockScript, MockTurn } from "../../../shared/mock-model";

export const PROMPTS = {
  usage: "Show my plan usage",
  usageThai: "สรุปการใช้งานของฉัน",
  help: "What can you help with?",
} as const;

const USAGE_SPEC: Spec = {
  root: "usage",
  elements: {
    usage: { type: "Card", props: { title: "Pro plan", description: "Billing period ends in 12 days" }, children: ["metrics", "storage", "upgrade"] },
    metrics: { type: "Grid", props: { columns: "2", gap: "sm" }, children: ["notes", "shares"] },
    notes: { type: "Metric", props: { label: "Notes", value: "1,284", detail: "+96 this month", trend: "up" }, children: [] },
    shares: { type: "Metric", props: { label: "Shared with you", value: "37", detail: "3 new", trend: "neutral" }, children: [] },
    storage: { type: "Progress", props: { label: "Storage", value: 72, detail: "7.2 of 10 GB" }, children: [] },
    upgrade: {
      type: "Button",
      props: { label: "Upgrade to Team", variant: "primary" },
      children: [],
      on: { press: [{ action: "toast", params: { message: "The upgrade flow would open here." } }] },
    },
  },
};

const USAGE_SPEC_THAI: Spec = {
  root: "usage",
  elements: {
    usage: { type: "Card", props: { title: "แพ็กเกจ Pro", description: "รอบบิลนี้เหลืออีก 12 วัน" }, children: ["metrics", "storage", "upgrade"] },
    metrics: { type: "Grid", props: { columns: "2", gap: "sm" }, children: ["notes", "shares"] },
    notes: { type: "Metric", props: { label: "โน้ต", value: "1,284", detail: "+96 เดือนนี้", trend: "up" }, children: [] },
    shares: { type: "Metric", props: { label: "แชร์ถึงคุณ", value: "37", detail: "ใหม่ 3 รายการ", trend: "neutral" }, children: [] },
    storage: { type: "Progress", props: { label: "พื้นที่เก็บข้อมูล", value: 72, detail: "7.2 จาก 10 GB" }, children: [] },
    upgrade: {
      type: "Button",
      props: { label: "อัปเกรดเป็น Team", variant: "primary" },
      children: [],
      on: { press: [{ action: "toast", params: { message: "หน้าจออัปเกรดจะเปิดตรงนี้" } }] },
    },
  },
};

const HELP_SPEC: Spec = {
  root: "help",
  elements: {
    help: {
      type: "List",
      props: {
        ordered: false,
        items: ["Explain any feature of Acme Notes", "Show your plan, storage and sharing at a glance", "Draft a note from a few keywords"],
      },
      children: [],
    },
  },
};

const TURNS: MockTurn[] = [
  { match: /plan usage/i, steps: [{ text: "Here is your plan this month." }, { spec: USAGE_SPEC }] },
  { match: /สรุปการใช้งาน/, steps: [{ text: "นี่คือการใช้งานของคุณในเดือนนี้ค่ะ" }, { spec: USAGE_SPEC_THAI }] },
  { match: /what can you help/i, steps: [{ text: "Three things, right from this page:" }, { spec: HELP_SPEC }] },
];

/** Every reply the widget's mock model can give; the prompts are what it lists when a message matches nothing. */
export const WIDGET_MOCK_SCRIPT: MockScript = { turns: TURNS, prompts: Object.values(PROMPTS) };
