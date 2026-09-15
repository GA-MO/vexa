import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const staticBuild = process.env.NEXT_PUBLIC_VEXA_STATIC === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const NODE_ONLY_MODULES = ["@ai-sdk/mcp/mcp-stdio"];
const BROWSER_STUB = "./lib/browser-stub.ts";

const nextConfig: NextConfig = {
  transpilePackages: ["vexa"],
  outputFileTracingRoot: path.join(appDir, "..", ".."),
  ...(staticBuild ? { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } } : {}),
  turbopack: {
    resolveAlias: Object.fromEntries(NODE_ONLY_MODULES.map((name) => [name, { browser: BROWSER_STUB }])),
  },
  webpack: (config, { isServer }) => {
    if (isServer) return config;
    for (const name of NODE_ONLY_MODULES) config.resolve.alias[name] = false;
    return config;
  },
};

export default nextConfig;
