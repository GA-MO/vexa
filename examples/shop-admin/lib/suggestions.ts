import type { ChatSuggestion } from "vexa/chat";

/** The chat's suggestion chips. Every prompt is a scripted line of a scenario (page-state, deep-link, theme-format, approval), so the mock model answers each one; lib/suggestions.test.ts keeps them in sync. */
export const SUGGESTIONS: readonly ChatSuggestion[] = [
  { label: "Show pending orders in Bangkok", prompt: "Show pending orders in Bangkok" },
  { label: "Open order C-1042", prompt: "Open order C-1042 and jump straight to its timeline" },
  { label: "Switch to dark theme", prompt: "Switch to dark theme" },
  { label: "Refund order C-1041", prompt: "Refund order C-1041, the customer changed their mind" },
];
