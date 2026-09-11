import { createRoot } from "react-dom/client";
import { McpAppView } from "./mcp-app-view";
import "./globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(<McpAppView />);
