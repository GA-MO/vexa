import { spawnSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = path.join(ROOT, "pages-site");

const configuredSiteUrl = new URL(process.env.VEXA_SITE_URL ?? "https://ga-mo.github.io/vexa");
configuredSiteUrl.hostname = configuredSiteUrl.hostname.toLowerCase();
const siteUrl = configuredSiteUrl.toString().replace(/\/$/, "");
const basePath = configuredSiteUrl.pathname.replace(/\/$/, "");

const shopAdminUrl = `${siteUrl}/shop-admin`;
const widgetUrl = `${siteUrl}/widget`;

function run(label: string, cwd: string, command: string, args: string[], env: Record<string, string>) {
  console.log(`\n== ${label}`);
  const result = spawnSync(command, args, { cwd: path.join(ROOT, cwd), stdio: "inherit", env: { ...process.env, ...env } });
  if (result.status !== 0) throw new Error(`${label} failed`);
}

/** Builds docs, shop-admin and the widget as static, mock-only sites and lays them out as one folder for GitHub Pages: / docs, /shop-admin, /widget. */
async function buildPages() {
  run("docs", "website", "bun", ["run", "build:static"], {
    VITE_VEXA_BASE_PATH: `${basePath}/`,
    VEXA_SITE_URL: siteUrl,
    VITE_VEXA_SHOP_ADMIN_URL: shopAdminUrl,
    VITE_VEXA_WIDGET_URL: widgetUrl,
  });
  run("shop-admin", "examples/shop-admin", "bun", ["run", "build:static"], {
    NEXT_PUBLIC_BASE_PATH: `${basePath}/shop-admin`,
    NEXT_PUBLIC_VEXA_DOCS_URL: siteUrl,
  });
  run("widget", "examples/embedded-widget", "bunx", ["vite", "build", "--base", `${basePath}/widget/`], {
    VITE_VEXA_DOCS_URL: siteUrl,
  });

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await cp(path.join(ROOT, "website/dist-static"), OUT_DIR, { recursive: true });
  await cp(path.join(ROOT, "examples/shop-admin/out"), path.join(OUT_DIR, "shop-admin"), { recursive: true });
  await cp(path.join(ROOT, "examples/embedded-widget/dist"), path.join(OUT_DIR, "widget"), { recursive: true });
  await cp(path.join(ROOT, "scripts/nojekyll"), path.join(OUT_DIR, ".nojekyll"));
  console.log(`\nPages site assembled in ${OUT_DIR} for ${siteUrl}`);
}

await buildPages();
