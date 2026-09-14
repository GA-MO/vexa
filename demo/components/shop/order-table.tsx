"use client";

import Link from "next/link";
import { cn, useVexaFormat } from "vexa/react";
import { totals, type Order } from "@/lib/shop/data";
import { useShop } from "@/lib/shop/store";
import { StatusBadge } from "./status-badge";

const HEADERS = ["Order", "Customer", "City", "Status", "Placed", "Total"] as const;

export function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function OrderTable({
  orders,
  selectedId,
  onSelect,
  emptyMessage = "No orders match.",
}: {
  orders: Order[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}) {
  const formatter = useVexaFormat();
  const { locale } = useShop();
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {HEADERS.map((header) => (
              <th key={header} className={cn("px-3 py-2 font-medium", header === "Total" && "text-right")}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="px-3 py-6 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
          {orders.map((order) => (
            <tr
              key={order.id}
              data-order-id={order.id}
              aria-selected={selectedId === order.id}
              onClick={onSelect ? () => onSelect(order.id) : undefined}
              className={cn(
                "border-t border-border transition-colors",
                onSelect && "cursor-pointer hover:bg-muted/50",
                selectedId === order.id && "bg-primary/10 hover:bg-primary/10",
              )}
            >
              <td className="px-3 py-2 font-medium">
                <Link href={`/orders/${order.id}`} className="text-primary underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>
                  {order.id}
                </Link>
              </td>
              <td className="px-3 py-2 text-foreground">{order.customer}</td>
              <td className="px-3 py-2 text-muted-foreground">{order.city}</td>
              <td className="px-3 py-2">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(order.createdAt, locale)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatter.money(totals(order).total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
