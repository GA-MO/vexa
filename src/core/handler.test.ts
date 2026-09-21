import { describe, expect, test } from "bun:test";
import { tool } from "ai";
import { ADMIN_TOOLS } from "../admin/names";
import { tierOf } from "./chat";
import { createVexaHandler, dropAdminHostTools, type ChatBody } from "./handler";

const HOST_TOOLS = [
  { name: "navigate", description: "Open a page", inputSchema: { type: "object" } },
  { name: ADMIN_TOOLS.observe, description: "Observe", inputSchema: { type: "object" } },
  { name: ADMIN_TOOLS.run, description: "Run steps", inputSchema: { type: "object" } },
];

const BODY: ChatBody = { messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] }], hostTools: HOST_TOOLS };

describe("dropAdminHostTools", () => {
  test("removes admin_* schemas when the handler has not opted in", () => {
    expect(dropAdminHostTools(BODY, undefined).hostTools?.map((item) => item.name)).toEqual(["navigate"]);
    expect(dropAdminHostTools(BODY, false).hostTools?.map((item) => item.name)).toEqual(["navigate"]);
  });

  test("keeps them with admin: true", () => {
    expect(dropAdminHostTools(BODY, true).hostTools?.map((item) => item.name)).toEqual(["navigate", ADMIN_TOOLS.observe, ADMIN_TOOLS.run]);
  });

  test("leaves a body without host tools alone", () => {
    const body = { ...BODY, hostTools: undefined };
    expect(dropAdminHostTools(body, false)).toBe(body);
  });
});

describe("tierOf", () => {
  const definition = tool({ description: "x", inputSchema: { type: "object" } as never });
  const hostToolNames = new Set(["navigate", ADMIN_TOOLS.observe, ADMIN_TOOLS.run]);

  test("admin_run is write tier only with admin on", () => {
    expect(tierOf(ADMIN_TOOLS.run, definition, {}, hostToolNames, true)).toBe("write");
    expect(tierOf(ADMIN_TOOLS.run, definition, {}, hostToolNames, false)).toBe("read");
  });

  test("other host tools stay read tier", () => {
    expect(tierOf("navigate", definition, {}, hostToolNames, true)).toBe("read");
    expect(tierOf(ADMIN_TOOLS.observe, definition, {}, hostToolNames, true)).toBe("read");
  });
});

describe("createVexaHandler pages file", () => {
  const model = {} as never;
  const pagesBody = JSON.stringify({ kind: "pages", file: { version: 1, pages: [], links: [] } });
  const put = (handler: { PUT: (req: Request) => Promise<Response> }) =>
    handler.PUT(new Request("http://localhost/api/chat", { method: "PUT", headers: { "content-type": "application/json" }, body: pagesBody }));

  test("GET publishes pagesFile.enabled only when a file is configured", async () => {
    const withFile = createVexaHandler({ model, admin: { pagesFile: ".vexa-test-pages.json" } });
    expect(await withFile.GET().then((response) => response.json())).toMatchObject({ pagesFile: { enabled: true } });
    const withoutFile = createVexaHandler({ model, admin: true });
    expect(await withoutFile.GET().then((response) => response.json())).not.toHaveProperty("pagesFile");
  });

  test("PUT is 404 without a file or in production", async () => {
    expect((await put(createVexaHandler({ model, admin: true }))).status).toBe(404);
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect((await put(createVexaHandler({ model, admin: { pagesFile: ".vexa-test-pages.json" } }))).status).toBe(404);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
