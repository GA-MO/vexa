type ChatHandler = { GET: () => Promise<Response>; POST: (request: Request) => Promise<Response> };

const DEFAULT_CHAT_PATH = "/api/chat";

/** Routes fetches to `path` (any base prefix) through the handler in the browser, so a static build with the mock model needs no server. */
export function serveChatInBrowser(handler: ChatHandler, path = DEFAULT_CHAT_PATH) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.href);
    if (!url.pathname.endsWith(path)) return originalFetch(input, init);
    return request.method === "GET" ? handler.GET() : handler.POST(request);
  };
}
