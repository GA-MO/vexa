"use client";

import { cn } from "vexa/react";
import { OrderTable } from "@/components/shop/order-table";
import { PageShell } from "@/components/shop/page-shell";
import { STATUSES } from "@/lib/shop/data";
import { filterOrders, useShop, useShopActions, type StatusFilter } from "@/lib/shop/store";

const STATUS_FILTERS: StatusFilter[] = ["all", ...STATUSES];

export default function OrdersPage() {
  const { orders, filters, selectedOrderId } = useShop();
  const { setFilter, selectOrder } = useShopActions();
  const visible = filterOrders(orders, filters);

  return (
    <PageShell
      title="Orders"
      description={`${visible.length} of ${orders.length} orders. Click a row to select it; the selection is part of the chat context.`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Status filter" className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={filters.status === status}
              onClick={() => setFilter({ status })}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                filters.status === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => setFilter({ search: event.target.value })}
          placeholder="Search id, customer, city"
          aria-label="Search orders"
          className="ml-auto h-8 w-full max-w-xs rounded-lg border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <OrderTable orders={visible} selectedId={selectedOrderId} onSelect={selectOrder} />
    </PageShell>
  );
}
