import { cn } from "vexa/react";
import type { Status } from "@/lib/shop/data";

const STATUS_TONE: Record<Status, string> = {
  pending: "bg-warning/10 text-warning",
  paid: "bg-info/10 text-info",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  refunded: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize", STATUS_TONE[status])}>
      {status}
    </span>
  );
}
