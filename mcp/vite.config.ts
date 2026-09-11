import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "agentic-ui/core": path.resolve(root, "../src/core/index.ts"),
      "agentic-ui/react": path.resolve(root, "../src/react/index.ts"),
      "agentic-ui/protocol": path.resolve(root, "../src/protocol/index.ts"),
      "agentic-ui/lib": path.resolve(root, "../src/lib"),
      "agentic-ui/ui": path.resolve(root, "../src/ui"),
      "agentic-ui/ai-elements": path.resolve(root, "../src/ai-elements"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(root, "index.html"),
    },
  },
});
