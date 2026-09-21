"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/components/shop/page-shell";
import { ProductTable } from "@/components/shop/product-table";
import { filterProducts, useShop } from "@/lib/shop/store";

const CREATE_LINK_CLASS =
  "inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-primary to-brand-violet px-3 text-sm font-medium text-primary-foreground";

export default function ProductsPage() {
  const { products, lastProductNotice } = useShop();
  const [search, setSearch] = useState("");
  const visible = filterProducts(products, search);

  return (
    <PageShell
      title="Products"
      description={`${visible.length} of ${products.length} products. The chat drives this page through its own controls; no product tool exists.`}
      actions={
        <Link href="/products/new" className={CREATE_LINK_CLASS}>
          Create product
        </Link>
      }
    >
      {lastProductNotice ? (
        <p role="status" className="text-sm text-success">
          {lastProductNotice}
        </p>
      ) : null}
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search name, SKU, category"
        aria-label="Search products"
        className="h-8 w-full max-w-xs rounded-lg border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <ProductTable products={visible} />
    </PageShell>
  );
}
