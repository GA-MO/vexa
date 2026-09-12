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
      "vexa/core": path.resolve(root, "../src/core/index.ts"),
      "vexa/examples": path.resolve(root, "../src/examples/index.ts"),
      "vexa/server": path.resolve(root, "../src/server/index.ts"),
      "vexa/react": path.resolve(root, "../src/react/index.ts"),
      "vexa/protocol": path.resolve(root, "../src/protocol/index.ts"),
      "vexa/lib": path.resolve(root, "../src/lib"),
      "vexa/ui": path.resolve(root, "../src/ui"),
      "vexa/ai-elements": path.resolve(root, "../src/ai-elements"),
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
