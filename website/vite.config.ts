import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { examplePages } from "./vite/example-pages.ts";
import CODE_THEMES from "./app/lib/code-themes.json" with { type: "json" };

const root = path.dirname(fileURLToPath(import.meta.url));
const librarySource = path.resolve(root, "../src");

const libraryPackage = createRequire(import.meta.url)("../package.json") as {
  dependencies: Record<string, string>;
};
const libraryDependencies = Object.keys(libraryPackage.dependencies);
const REACT_PACKAGES = ["react", "react-dom"];
const libraryDependenciesWithoutReact = libraryDependencies.filter((name) => !REACT_PACKAGES.includes(name));

export default defineConfig(({ command }) => ({
  base: process.env.VITE_VEXA_BASE_PATH ?? "/",
  plugins: [
    fumadocsMdx({ globalOptions: { mdxOptions: { rehypeCodeOptions: { themes: CODE_THEMES } } } }),
    tailwindcss(),
    reactRouter(),
    examplePages(root),
  ],
  ssr: { noExternal: command === "build" ? true : libraryDependenciesWithoutReact },
  resolve: {
    dedupe: ["react", "react-dom", ...libraryDependencies],
    alias: [
      { find: /^@\//, replacement: `${path.join(root, "app")}/` },
      { find: /^vexa$/, replacement: path.join(librarySource, "index.ts") },
      { find: "vexa/protocol", replacement: path.join(librarySource, "protocol/index.ts") },
      { find: "vexa/core", replacement: path.join(librarySource, "core/index.ts") },
      { find: "vexa/examples", replacement: path.join(librarySource, "examples/index.ts") },
      { find: "vexa/server", replacement: path.join(librarySource, "server/index.ts") },
      { find: "vexa/eval", replacement: path.join(librarySource, "eval/index.ts") },
      { find: "vexa/mock", replacement: path.join(librarySource, "mock/index.ts") },
      { find: "vexa/react", replacement: path.join(librarySource, "react/index.ts") },
      { find: "vexa/chat", replacement: path.join(librarySource, "chat/index.ts") },
      { find: "vexa/styles.css", replacement: path.join(librarySource, "styles.css") },
      { find: "vexa/lib", replacement: path.join(librarySource, "lib") },
      { find: "vexa/ui", replacement: path.join(librarySource, "ui") },
      { find: "vexa/ai-elements", replacement: path.join(librarySource, "ai-elements") },
    ],
  },
}));
