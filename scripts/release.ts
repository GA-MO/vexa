import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REPO = "GA-MO/vexa";
const RELEASE_BRANCH = "main";
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const FILES_WITH_INSTALL_SNIPPETS = [
  "README.md",
  "website/content/docs/get-started.mdx",
  "website/content/docs/examples/starters.mdx",
  "examples/starter-next/README.md",
  "examples/starter-vite/README.md",
];

function git(...args: string[]): string {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`);
}

function assertReleasable() {
  if (git("branch", "--show-current") !== RELEASE_BRANCH) throw new Error(`release from ${RELEASE_BRANCH}`);
  if (git("status", "--porcelain") !== "") throw new Error("commit or stash your changes first");
  git("fetch", "origin", RELEASE_BRANCH);
  if (git("rev-parse", "HEAD") !== git("rev-parse", `origin/${RELEASE_BRANCH}`)) throw new Error(`local ${RELEASE_BRANCH} is not in sync with origin`);
}

function installSnippetPatterns(version: string) {
  return [`github:${REPO}#v${version}`, `releases/download/v${version}/vexa-${version}.tgz`];
}

function replaceInstallSnippets(previous: string, next: string) {
  const [previousPatterns, nextPatterns] = [installSnippetPatterns(previous), installSnippetPatterns(next)];
  for (const file of FILES_WITH_INSTALL_SNIPPETS) {
    const filePath = path.join(ROOT, file);
    let content = readFileSync(filePath, "utf8");
    previousPatterns.forEach((pattern, index) => {
      content = content.replaceAll(pattern, nextPatterns[index]);
    });
    writeFileSync(filePath, content);
  }
}

function bumpPackageVersion(next: string): string {
  const filePath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(filePath, "utf8")) as { version: string };
  const previous = pkg.version;
  if (previous === next) throw new Error(`package.json is already at ${next}`);
  writeFileSync(filePath, `${JSON.stringify({ ...pkg, version: next }, null, 2)}\n`);
  return previous;
}

/** `bun run release 0.2.0`: bumps the version, rewrites the install snippets, commits, tags v0.2.0 and pushes; the release workflow packs the tarball and publishes the GitHub Release. */
function release(version: string | undefined) {
  if (!version || !SEMVER.test(version)) throw new Error("usage: bun run release <semver>, for example 0.2.0");
  assertReleasable();
  run("bun", ["run", "typecheck"]);
  const previous = bumpPackageVersion(version);
  replaceInstallSnippets(previous, version);
  const tag = `v${version}`;
  git("add", "-A");
  git("commit", "-m", `Release ${tag}`);
  git("tag", "-a", tag, "-m", tag);
  git("push", "origin", RELEASE_BRANCH, tag);
  console.log(`\nPushed ${tag}. Watch https://github.com/${REPO}/actions/workflows/release.yml, then https://github.com/${REPO}/releases/tag/${tag}`);
}

release(process.argv[2]);
