import { cp, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = fileURLToPath(new URL("..", import.meta.url));
const CLIENT_DIR = path.join(SITE_DIR, "build/client");
const OUT_DIR = path.join(SITE_DIR, "dist-static");
const NOT_FOUND_DIR = "404.html";

const basePath = (process.env.VITE_VEXA_BASE_PATH ?? "/").replace(/^\/|\/$/g, "");

/** React Router prerenders the pages under the basename and Vite writes the assets at the client root; a static host serves one folder at the base path, so this folds both into dist-static. */
async function assemble() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await cp(basePath ? path.join(CLIENT_DIR, basePath) : CLIENT_DIR, OUT_DIR, { recursive: true });
  if (basePath) await cp(path.join(CLIENT_DIR, "assets"), path.join(OUT_DIR, "assets"), { recursive: true });
  const notFoundPage = path.join(OUT_DIR, NOT_FOUND_DIR, "index.html");
  const parked = path.join(OUT_DIR, "404.parked.html");
  await rename(notFoundPage, parked);
  await rm(path.join(OUT_DIR, NOT_FOUND_DIR), { recursive: true });
  await rename(parked, path.join(OUT_DIR, NOT_FOUND_DIR));
}

await assemble();
console.log(`static site assembled in ${OUT_DIR}`);
