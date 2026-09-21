import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { chatApi } from "./vite/chat-api.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const librarySource = path.resolve(root, "../../src");

const libraryPackage = createRequire(import.meta.url)("../../package.json") as { dependencies: Record<string, string> };
const libraryDependencies = Object.keys(libraryPackage.dependencies);

export default defineConfig({
  plugins: [tailwindcss(), react(), chatApi()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    "process.env.REACT_APP_DATA_PROVIDER": JSON.stringify(""),
  },
  server: { port: 3007 },
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom", "@mui/material", "@mui/system", "@mui/utils", "@mui/icons-material", "@emotion/react", "@emotion/styled", "ra-core", "ra-ui-materialui", "react-admin", "@tanstack/react-query", ...libraryDependencies],
    alias: [
      { find: /^vexa$/, replacement: path.join(librarySource, "index.ts") },
      { find: "vexa/protocol", replacement: path.join(librarySource, "protocol/index.ts") },
      { find: "vexa/core", replacement: path.join(librarySource, "core/index.ts") },
      { find: "vexa/examples", replacement: path.join(librarySource, "examples/index.ts") },
      { find: "vexa/server", replacement: path.join(librarySource, "server/index.ts") },
      { find: "vexa/mock", replacement: path.join(librarySource, "mock/index.ts") },
      { find: "vexa/admin", replacement: path.join(librarySource, "admin/index.ts") },
      { find: "vexa/react", replacement: path.join(librarySource, "react/index.ts") },
      { find: "vexa/chat", replacement: path.join(librarySource, "chat/index.ts") },
      { find: "vexa/styles.css", replacement: path.join(librarySource, "styles.css") },
      { find: "vexa/lib", replacement: path.join(librarySource, "lib") },
      { find: "vexa/ui", replacement: path.join(librarySource, "ui") },
      { find: "vexa/ai-elements", replacement: path.join(librarySource, "ai-elements") },
    ],
  },
});
