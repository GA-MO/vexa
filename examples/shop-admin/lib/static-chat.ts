import { serveChatInBrowser } from "../../shared/browser-chat";
import { MOCK_MODEL_ENTRY } from "@/lib/mock-model";
import { createShopChatHandler } from "@/lib/shop/chat-handler";

let installed = false;

export function serveStaticChat() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  serveChatInBrowser(createShopChatHandler({ models: () => MOCK_MODEL_ENTRY }));
}
