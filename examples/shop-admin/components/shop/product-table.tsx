"use client";

import Link from "next/link";
import { cn, useVexaFormat } from "vexa/react";
import type { Product, ProductStatus } from "@/lib/shop/data";

const HEADERS = ["Name", "SKU", "Category", "Price", "Status"] as const;

const STATUS_TONE: Record<ProductStatus, string> = {
  active: "bg-success/10 text-success",
  draft: "bg-warning/10 text-warning",
  archived: "bg-muted text-muted-foreground",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize", STATUS_TONE[status])}>{status}</span>;
}

export function ProductTable({ products }: { products: Product[] }) {
  const formatter = useVexaFormat();
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {HEADERS.map((header) => (
              <th key={header} className={cn("px-3 py-2 font-medium", header === "Price" && "text-right")}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="px-3 py-6 text-center text-muted-foreground">
                No products match.
              </td>
            </tr>
          ) : null}
          {products.map((product) => (
            <tr key={product.id} className="border-t border-border">
              <td className="px-3 py-2 font-medium">
                <Link href={`/products/${product.id}`} className="text-primary underline-offset-2 hover:underline">
                  {product.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{product.sku}</td>
              <td className="px-3 py-2 text-foreground">{product.category}</td>
              <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatter.money(product.price)}</td>
              <td className="px-3 py-2">
                <ProductStatusBadge status={product.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
