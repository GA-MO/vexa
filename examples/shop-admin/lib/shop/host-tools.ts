import { z } from "zod";
import type { HostToolDescriptor } from "vexa/react";
import { CITIES, CURRENCIES, LOCALES, STATUSES, THEMES } from "./data";

export const ROUTES = ["/", "/orders", "/settings", "/guides"] as const;
export const ORDER_SECTIONS = ["items", "timeline"] as const;
const DESCRIPTION_MAX_LENGTH = 300;

export const HOST_TOOL_DEFINITIONS = {
  navigate: {
    description: "Open one of the admin pages: / (overview), /orders, /settings, or /guides.",
    input: z.object({ to: z.enum(ROUTES) }),
  },
  set_filter: {
    description:
      "Filter the orders table by status and/or a search text matched against order id, customer name and city; opens /orders and returns the matching rows.",
    input: z.object({
      status: z.enum([...STATUSES, "all"]).optional().describe("Order status, or all"),
      search: z.string().max(80).optional().describe(`Free text matched against id, customer and city, for example ${CITIES[0]}`),
    }),
  },
  select_order: {
    description: "Highlight one row in the orders table by order id without leaving the page.",
    input: z.object({ id: z.string().min(1) }),
  },
  open_order: {
    description: "Open the detail page of one order by id and optionally scroll to its items or timeline section.",
    input: z.object({ id: z.string().min(1), section: z.enum(ORDER_SECTIONS).optional() }),
  },
  update_status: {
    description:
      "Change an order's status (pending, paid, shipped, delivered, refunded) and add a timeline event. Call it directly with the id and status from the request: it looks the order up itself and opens its own confirmation prompt in the app, so do not read the order first or ask for confirmation in chat.",
    input: z.object({ id: z.string().min(1), status: z.enum(STATUSES) }),
  },
  set_theme: {
    description:
      "Switch the admin between the light and dark theme. Call it directly as soon as the user asks; it opens its own confirmation prompt in the app, so do not ask the user to confirm in chat first.",
    input: z.object({ theme: z.enum(THEMES) }),
  },
  set_locale: {
    description: "Set the display locale (en-US or de-DE) and currency (USD or EUR) used for every number on screen.",
    input: z.object({ locale: z.enum(LOCALES), currency: z.enum(CURRENCIES) }),
  },
} as const;

export type HostToolName = keyof typeof HOST_TOOL_DEFINITIONS;

for (const [name, definition] of Object.entries(HOST_TOOL_DEFINITIONS)) {
  if (definition.description.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(`Host tool "${name}" description is ${definition.description.length} characters; VexaProvider truncates at ${DESCRIPTION_MAX_LENGTH}`);
  }
}

/** The descriptor a scenario sends to the server, derived from the same definition the app registers. */
export function hostToolDescriptor(name: HostToolName): HostToolDescriptor {
  const definition = HOST_TOOL_DEFINITIONS[name];
  return { name, description: definition.description, inputSchema: z.toJSONSchema(definition.input) };
}
