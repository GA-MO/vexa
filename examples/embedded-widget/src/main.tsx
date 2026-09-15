import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { serveChatInBrowser } from "../../shared/browser-chat";
import { App } from "./app";
import { createWidgetChatHandler } from "./chat-handler";
import "./app.css";

if (import.meta.env.PROD) serveChatInBrowser(createWidgetChatHandler());

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
