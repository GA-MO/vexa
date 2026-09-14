"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useVexaFormat, useVexaHost } from "vexa/react";
import { useChatControls } from "@/components/demo-host";
import { formatDate } from "@/components/shop/order-table";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { StatusBadge } from "@/components/shop/status-badge";
import { findOrder, totals, type Order, type Status } from "@/lib/shop/data";
import { useShop } from "@/lib/shop/store";

const NEXT_STATUS: Partial<Record<Status, { label: string; status: Status }>> = {
  pending: { label: "Mark paid", status: "paid" },
  paid: { label: "Mark shipped", status: "shipped" },
  shipped: { label: "Mark delivered", status: "delivered" },
};

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function OrderActions({ order }: { order: Order }) {
  const { runTool, sendToChat } = useVexaHost();
  const { openChat } = useChatControls();
  const [message, setMessage] = useState<string | null>(null);
  const next = NEXT_STATUS[order.status];

  const advance = async () => {
    if (!next) return;
    const result = await runTool("update_status", { id: order.id, status: next.status });
    setMessage(result.ok ? result.summary ?? "Updated" : result.error);
  };

  const ask = () => {
    openChat();
    sendToChat(`Tell me about order ${order.id}: current status, items, and what should happen next.`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next ? (
        <button
          type="button"
          onClick={advance}
          className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-primary to-brand-violet px-3 text-sm font-medium text-primary-foreground"
        >
          {next.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={ask}
        className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted"
      >
        Ask about this order
      </button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}

function ItemsPanel({ order }: { order: Order }) {
  const formatter = useVexaFormat();
  const sums = totals(order);
  return (
    <Panel id="items" title="Items">
      <ul className="flex flex-col divide-y divide-border text-sm">
        {order.items.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 py-2">
            <span className="text-foreground">
              {item.name} <span className="text-muted-foreground">× {item.qty}</span>
            </span>
            <span className="tabular-nums text-foreground">{formatter.money(item.qty * item.price)}</span>
          </li>
        ))}
      </ul>
      <dl id="totals" className="flex flex-col gap-1 border-t border-border pt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatter.money(sums.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{sums.shipping === 0 ? "Free" : formatter.money(sums.shipping)}</dd>
        </div>
        <div className="flex justify-between font-semibold text-foreground">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatter.money(sums.total)}</dd>
        </div>
      </dl>
    </Panel>
  );
}

function TimelinePanel({ order, locale }: { order: Order; locale: string }) {
  return (
    <Panel id="timeline" title="Timeline">
      <ol className="flex flex-col gap-3">
        {order.timeline.map((event, index) => (
          <li key={`${event.at}-${index}`} className="flex gap-3 text-sm">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gradient-to-br from-primary to-brand-violet" aria-hidden />
            <div className="flex min-w-0 flex-col">
              <span className="font-medium text-foreground">{event.title}</span>
              {event.detail ? <span className="text-muted-foreground">{event.detail}</span> : null}
              <time dateTime={event.at} className="text-xs text-muted-foreground">
                {formatTime(event.at, locale)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { orders, locale } = useShop();
  const order = findOrder(orders, params.id);

  if (!order) {
    return (
      <PageShell title="Order not found" description={`No order with id "${params.id}".`}>
        <Link href="/orders" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Back to orders
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={order.id}
      description={`${order.customer} · ${order.city} · placed ${formatDate(order.createdAt, locale)}`}
      actions={<StatusBadge status={order.status} />}
    >
      <OrderActions order={order} />
      <div className="grid gap-4 md:grid-cols-2">
        <ItemsPanel order={order} />
        <TimelinePanel order={order} locale={locale} />
      </div>
      <Link href="/orders" className="self-start text-sm font-medium text-primary underline-offset-2 hover:underline">
        Back to orders
      </Link>
    </PageShell>
  );
}
