type ChatHandler = { GET: () => Promise<Response>; POST: (request: Request) => Promise<Response>; PUT?: (request: Request) => Promise<Response> };

function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}

function dispatch(handler: ChatHandler, request: Request): Promise<Response> {
  if (request.method === "GET") return handler.GET();
  if (request.method === "POST") return handler.POST(request);
  if (request.method === "PUT" && handler.PUT) return handler.PUT(request);
  return Promise.resolve(notFound());
}

const DEFAULT_CHAT_PATH = "/api/chat";

/** Routes fetches to `path` (any base prefix) through the handler in the browser, so a static build with the mock model needs no server. */
export function serveChatInBrowser(handler: ChatHandler, path = DEFAULT_CHAT_PATH) {
  const originalFetch = window.fetch.bind(window);
  const routedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.href);
    if (!url.pathname.endsWith(path)) return originalFetch(input, init);
    return dispatch(handler, request);
  };
  window.fetch = routedFetch as typeof window.fetch;
}
