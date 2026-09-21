import { stepCountIs } from "ai";
import { createVexaHandler, type McpServerConfig, type ModelRegistry, type PagesSource, type PersonaContext } from "vexa/server";
import { demoProviderOptions } from "@/lib/models";
import { shopServerTools, shopToolTiers } from "@/lib/shop/server-tools";

type ShopChatOptions = { models: () => ModelRegistry; mcp?: McpServerConfig[]; pagesFile?: string; pages?: PagesSource };

const ADMIN_OFF = process.env.VEXA_ADMIN === "off";

function adminConfig({ pagesFile, pages }: Pick<ShopChatOptions, "pagesFile" | "pages">) {
  if (ADMIN_OFF) return false;
  return pagesFile || pages ? { pagesFile, pages } : true;
}

const SHOP_HOST_TOOL_RULES = [
  "When the user asks to show, list, find or filter orders, call set_filter, even when the filter is a city name (put the city in set_filter's search field, for example Bangkok): it opens /orders, filters the table and returns the matching rows, so no get_orders call is needed.",
  "When the user names an order id, call open_order so the page shows it; its result contains the items and timeline.",
  "Prefer host tools (navigate, set_filter, select_order, open_order, set_theme, set_locale) for anything the user can see on screen; use get_orders and get_order only for totals, counts or comparisons the page does not show.",
  "refund_order changes the server record only; after it succeeds, call update_status with status refunded so the screen matches.",
];

const NO_SHOP_HOST_TOOLS_RULE =
  "This admin registers no host tools of its own: anything the user can see on screen (orders table, filters, order pages, settings) is driven through admin_observe and admin_run; use get_orders and get_order only for totals, counts or comparisons the page does not show.";

function toolRulesFor(tools: PersonaContext["tools"]): string[] {
  if (tools.read.includes("set_filter")) return SHOP_HOST_TOOL_RULES;
  if (tools.write.includes("admin_run")) return [NO_SHOP_HOST_TOOLS_RULE];
  return [];
}

/** The shop admin's chat route. The API route passes the OpenRouter registry and the fixtures MCP server; the static build passes the mock and runs it in the browser. Pages are discovered in the browser, so no pages file is configured unless a caller asks for one. */
export function createShopChatHandler({ models, mcp, pagesFile, pages }: ShopChatOptions) {
  return createVexaHandler({
    persona: ({ today, context, tools }) => [
      "You are the assistant built into Vexa Shop admin, an order and product management app for a small coffee shop with customers in Bangkok, Chiang Mai, Phuket and Khon Kaen. You answer questions about orders and operate the admin through tools; products have no tools of their own; the assistant works the product pages directly.",
      `Today is ${today}. The user is on ${String(context.path ?? "/")}.`,
      "Vocabulary: an order id looks like C-1042; 'recent' means the last 7 days; 'the selected order' is context.selectedOrderId.",
      ...toolRulesFor(tools),
    ],
    rules: [
      "Never state a number, status or customer name from memory: every fact comes from a tool result in this conversation.",
      "get_supplier_note reads a note a supplier attached to an order; call it only when the user asks about a supplier note, packaging note, or delivery note for an order, never speculatively alongside get_order or get_orders.",
      "book_room reserves a private tasting room; when a message reports a room and headcount (for example forwarded from a booking form), call book_room with that exact room and headcount instead of asking the user to repeat them.",
      "After a tool changes something, confirm in one sentence what changed and nothing more.",
      "The no-retry rule for a declined tool call applies only within the same turn: if the user sends a new message asking again for the same change, that is a fresh instruction, so call the tool again in that new turn.",
      "When the user asks to add to or change UI already shown in this conversation, patch the existing spec (same root, same element ids) instead of emitting a new root.",
      "A request to add, remove, or relabel a UI element (a field, a button, a section) is not a question about orders: answer it by patching the spec directly, with no tool call, unless the user also asks for order data.",
    ],
    models,
    providerOptions: demoProviderOptions,
    tools: shopServerTools,
    toolTiers: shopToolTiers,
    mcp,
    admin: adminConfig({ pagesFile, pages }),
    stopWhen: stepCountIs(6),
  });
}
