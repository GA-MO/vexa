import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { createServerModuleRunner, type Plugin } from "vite";
import type { createWidgetChatHandler } from "../src/chat-handler.ts";

const CHAT_PATH = "/api/chat";
const LOCAL_ORIGIN = "http://localhost";
const HANDLER_MODULE = "/src/chat-handler.ts";

type ChatHandlerModule = { createWidgetChatHandler: typeof createWidgetChatHandler };

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

/** Serves the Vexa chat route from the Vite dev server: GET publishes the model list, POST streams the reply from the scripted mock model. The handler module is loaded through Vite so the `vexa/*` aliases apply. */
export function chatApi(): Plugin {
  return {
    name: "vexa-chat-api",
    configureServer(server) {
      const runner = createServerModuleRunner(server.environments.ssr);
      const handler = runner.import<ChatHandlerModule>(HANDLER_MODULE).then((module) => module.createWidgetChatHandler());
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
