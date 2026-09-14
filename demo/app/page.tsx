"use client";

import Link from "next/link";
import { BarChart, Metric, useVexaFormat } from "vexa/react";
import { OrderTable } from "@/components/shop/order-table";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { metrics, recentOrders, revenueByMonth } from "@/lib/shop/data";
import { useShop } from "@/lib/shop/store";

const RECENT_LIMIT = 5;

export default function OverviewPage() {
  const { orders } = useShop();
  const formatter = useVexaFormat();
  const summary = metrics(orders);
  const months = revenueByMonth(orders);

  return (
    <PageShell
      title="Overview"
      description="Vexa Shop admin: the host app the chat overlay controls. Data is in memory and resets on reload."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric props={{ label: "Revenue, last 30 days", value: formatter.money(summary.revenue), detail: `${formatter.integer(summary.orderCount)} orders`, trend: "up" }} />
        <Metric props={{ label: "Pending", value: formatter.integer(summary.pendingCount), detail: "Awaiting payment", trend: summary.pendingCount > 3 ? "down" : "neutral" }} />
        <Metric props={{ label: "Average order", value: formatter.money(summary.averageOrderValue), detail: "Paid orders only", trend: "neutral" }} />
      </div>

      <div className="@container/vexa">
        <BarChart
          props={{
            title: "Revenue by month",
            labels: months.map((month) => month.month),
            series: [{ name: "Revenue", values: months.map((month) => month.revenue) }],
            format: "currency",
            showValues: true,
          }}
        />
      </div>

      <Panel title="Recent orders">
        <OrderTable orders={recentOrders(orders, RECENT_LIMIT)} />
        <Link href="/orders" className="self-start text-sm font-medium text-primary underline-offset-2 hover:underline">
          All orders
        </Link>
      </Panel>
    </PageShell>
  );
}
