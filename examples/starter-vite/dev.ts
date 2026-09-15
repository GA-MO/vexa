import { spawn } from "node:child_process";

const WEB_PORT = "3005";

const processes = [
  spawn("bun", ["--watch", "server.ts"], { stdio: "inherit" }),
  spawn("bunx", ["vite", "--port", WEB_PORT], { stdio: "inherit" }),
];

function stopAll() {
  for (const child of processes) child.kill();
}

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
for (const child of processes) child.on("exit", stopAll);
