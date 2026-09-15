import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = fileURLToPath(new URL("..", import.meta.url));
const API_DIR = path.join(APP_DIR, "app/api");
const PARKED_API_DIR = path.join(APP_DIR, ".api-parked");

/** `output: "export"` refuses POST route handlers, so the chat route is parked during the build; the export runs the mock in the browser instead. */
async function withApiParked(run: () => number) {
  if (existsSync(PARKED_API_DIR)) throw new Error(`${PARKED_API_DIR} exists: a previous static build did not finish, move it back to app/api first`);
  await rename(API_DIR, PARKED_API_DIR);
  try {
    return run();
  } finally {
    await rename(PARKED_API_DIR, API_DIR);
  }
}

const status = await withApiParked(() => {
  const result = spawnSync("bunx", ["next", "build"], {
    cwd: APP_DIR,
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_VEXA_STATIC: "1" },
  });
  return result.status ?? 1;
});
process.exit(status);
