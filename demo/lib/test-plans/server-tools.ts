import type { Spec } from "vexa/protocol";
import { ORDERS, totals } from "@/lib/shop/data";
import type { Scenario } from "@/lib/scenarios/types";

const CITY = "Phuket";
const STATUS = "delivered";

const matches = ORDERS.filter((order) => order.city === CITY && order.status === STATUS);
const totalAmount = matches.reduce((sum, order) => sum + totals(order).total, 0);
const orderCount = matches.length;
const totalFormatted = totalAmount.toLocaleString("en-US");

const rows = matches.map((order) => ({ id: order.id, total: totals(order).total }));

const spec: Spec = {
  root: "root",
  elements: {
    root: {
      type: "Table",
      props: { columns: [{ key: "id", label: "Order" }, { key: "total", label: "Total" }], rows },
    },
  },
};

export const scenario: Scenario = {
  id: "server-tools",
  title: "Read tools ground the answer in real numbers",
  controlPath: `user asks a count+total question → get_orders (status=${STATUS}, city=${CITY}) → answer matches data.ts`,
  page: "/orders",
  fixture: { spec },
  script: [
    {
      user: `How many delivered orders are there in Phuket, and what's their total?`,
      expectTools: ["get_orders"],
      expectText: new RegExp(`(?=.*\\b${orderCount}\\b)(?=.*(${totalAmount}|${totalFormatted}))`, "s"),
    },
  ],
  bestPractice:
    "Never let the model state a count or a total from memory: get_orders is read-tier and the rule \"every fact comes from a tool result in this conversation\" is what makes the reply's numbers match demo/lib/shop/data.ts exactly, run after run.",
};
