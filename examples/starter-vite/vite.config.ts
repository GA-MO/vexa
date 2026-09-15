import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const librarySource = path.resolve(root, "../../src");
const API_ORIGIN = `http://localhost:${process.env.API_PORT ?? "3006"}`;

const libraryPackage = createRequire(import.meta.url)("../../package.json") as { dependencies: Record<string, string> };
const libraryDependencies = Object.keys(libraryPackage.dependencies);

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: { proxy: { "/api": API_ORIGIN } },
  resolve: {
    dedupe: ["react", "react-dom", ...libraryDependencies],
    alias: [
      { find: /^vexa$/, replacement: path.join(librarySource, "index.ts") },
      { find: "vexa/protocol", replacement: path.join(librarySource, "protocol/index.ts") },
      { find: "vexa/core", replacement: path.join(librarySource, "core/index.ts") },
      { find: "vexa/react", replacement: path.join(librarySource, "react/index.ts") },
      { find: "vexa/chat", replacement: path.join(librarySource, "chat/index.ts") },
      { find: "vexa/styles.css", replacement: path.join(librarySource, "styles.css") },
      { find: "vexa/lib", replacement: path.join(librarySource, "lib") },
      { find: "vexa/ui", replacement: path.join(librarySource, "ui") },
      { find: "vexa/ai-elements", replacement: path.join(librarySource, "ai-elements") },
    ],
  },
});
