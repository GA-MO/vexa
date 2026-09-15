import type { ChatLabels } from "vexa/chat";
import type { VexaTheme } from "vexa/react";

export type ThemePreset = { id: string; name: string; theme: VexaTheme };

export const THEME_PRESETS: ThemePreset[] = [
  { id: "indigo", name: "Indigo (library default)", theme: { mode: "light" } },
  { id: "emerald", name: "Emerald, rounder", theme: { primary: "#059669", primaryDark: "#34d399", secondary: "#0d9488", radius: "1rem", mode: "light" } },
  { id: "rose-dark", name: "Rose on dark", theme: { primary: "#e11d48", primaryDark: "#fb7185", secondary: "#db2777", radius: "0.5rem", mode: "dark" } },
];

export type Language = "en" | "th";

export type LanguagePreset = {
  id: Language;
  name: string;
  locale: string;
  currency: string;
  title: string;
  subtitle: string;
  labels: Partial<ChatLabels>;
};

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  { id: "en", name: "English (library default)", locale: "en-US", currency: "USD", title: "Acme Notes help", subtitle: "Ask about your notes and plan", labels: {} },
  {
    id: "th",
    name: "ไทย",
    locale: "th-TH",
    currency: "THB",
    title: "ผู้ช่วย Acme Notes",
    subtitle: "ถามเรื่องโน้ตและแพ็กเกจของคุณ",
    labels: {
      emptyTitle: "ถามอะไรก็ได้ แล้วรับคำตอบเป็น UI",
      emptyDescription: "ตอบเป็นข้อความ หรือสร้างการ์ด ตัวเลข และตารางให้ตรงนี้",
      thinking: "กำลังคิด...",
      reasoning: "เหตุผล",
      thoughtFor: (seconds) => `คิดอยู่ ${seconds} วินาที`,
      steps: (count) => `${count} ขั้นตอน`,
      approveTool: (tool) => `อนุญาตให้รัน ${tool} ไหม`,
      approved: "อนุญาตแล้ว",
      rejected: "ปฏิเสธแล้ว",
      approve: "อนุญาต",
      reject: "ปฏิเสธ",
      runOnPage: (tool) => `รัน ${tool} บนหน้านี้`,
      run: "รัน",
      cancel: "ยกเลิก",
      restore: "ย้อนกลับ",
      restoreTooltip: "ย้อนบทสนทนากลับมาที่จุดนี้",
      startOver: "เริ่มใหม่",
      closeChat: "ปิดแชท",
      openAssistant: "เปิดผู้ช่วย",
      closeAssistant: "ปิดผู้ช่วย",
      buttonPressed: (tool) => `กดปุ่ม ${tool}`,
    },
  },
];

export type Position = "bottom-right" | "bottom-left";

export const POSITIONS: Position[] = ["bottom-right", "bottom-left"];

export const DEFAULT_LAUNCHER_LABEL = "Ask Acme";
