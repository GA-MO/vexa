import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["vexa"],
  outputFileTracingRoot: path.join(demoDir, ".."),
};

export default nextConfig;
