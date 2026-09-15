import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { Plugin } from "vite";
import { createVexaHandler } from "../../../src/server/index.ts";
import { createScriptedModel, MOCK_MODEL_ID } from "../../shared/mock-model.ts";
import { WIDGET_MOCK_SCRIPT } from "../src/guides/mock-script.ts";

const CHAT_PATH = "/api/chat";
const LOCAL_ORIGIN = "http://localhost";

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

/** Serves the Vexa chat route from the Vite dev server: GET publishes the model list, POST streams the reply from the scripted mock model. */
export function chatApi(): Plugin {
  const { GET, POST } = createVexaHandler({
    models: { [MOCK_MODEL_ID]: { model: () => createScriptedModel(WIDGET_MOCK_SCRIPT), name: "Mock (scripted, free)", provider: "vexa-mock", maxTokens: 8_000 } },
    persona: "You are the help assistant of Acme Notes, a note-taking app.",
  });
  return {
    name: "vexa-chat-api",
    configureServer(server) {
      server.middlewares.use(CHAT_PATH, (req, res, next) => {
        const handle = req.method === "POST" ? POST : req.method === "GET" ? GET : null;
        if (!handle) return next();
        void handle(toRequest(req)).then((response) => sendResponse(res, response), next);
      });
    },
  };
}
