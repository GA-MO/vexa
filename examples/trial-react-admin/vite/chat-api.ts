import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServerModuleRunner, type Plugin } from "vite";
import type { createTrialChatHandler } from "../src/vexa/chat-handler.ts";

const CHAT_PATH = "/api/chat";
const LOCAL_ORIGIN = "http://localhost";
const HANDLER_MODULE = "/src/vexa/chat-handler.ts";

const SHOP_ADMIN_ENV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../shop-admin/.env.local");

function loadShopAdminEnv() {
  const lines = readFileSync(SHOP_ADMIN_ENV, "utf8").split("\n");
  for (const line of lines) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

type ChatHandlerModule = { createTrialChatHandler: typeof createTrialChatHandler };

function toRequest(req: IncomingMessage): Request {
  const method = req.method ?? "GET";
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(", "));
  }
  const hasBody = method !== "GET" && method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = { method, headers, duplex: "half" };
  if (hasBody) init.body = Readable.toWeb(req) as ReadableStream;
  return new Request(new URL(req.url ?? "/", LOCAL_ORIGIN), init);
}

async function sendResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (!response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) res.write(next.value);
  res.end();
}

/** Serves the Vexa chat route from the Vite dev server: GET publishes the model list, POST streams the reply from the OpenRouter models. The handler module is loaded through Vite so the `vexa/*` aliases apply. */
export function chatApi(): Plugin {
  return {
    name: "vexa-chat-api",
    configureServer(server) {
      loadShopAdminEnv();
      const runner = createServerModuleRunner(server.environments.ssr);
      const handler = runner.import<ChatHandlerModule>(HANDLER_MODULE).then((module) => module.createTrialChatHandler());
      server.middlewares.use(CHAT_PATH, (req, res, next) => {
        void handler
          .then(({ GET, POST }) => {
            const handle = req.method === "POST" ? POST : req.method === "GET" ? GET : null;
            if (!handle) return next();
            return handle(toRequest(req)).then((response) => sendResponse(res, response));
          })
          .catch(next);
      });
    },
  };
}
