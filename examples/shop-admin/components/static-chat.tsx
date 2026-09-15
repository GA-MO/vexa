"use client";

import { serveStaticChat } from "@/lib/static-chat";

serveStaticChat();

/** Mounted only in the static export: evaluating this module routes /api/chat to the in-browser mock handler before the chat asks for the model list. */
export function StaticChat() {
  return null;
}
