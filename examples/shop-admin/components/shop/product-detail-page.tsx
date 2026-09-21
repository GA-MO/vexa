"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/shop/page-shell";
import { ProductForm } from "@/components/shop/product-form";
import { ProductStatusBadge } from "@/components/shop/product-table";
import { findProduct, type Product } from "@/lib/shop/data";
import { useShop, useShopActions } from "@/lib/shop/store";

const DANGER_BUTTON_CLASS = "inline-flex h-9 items-center rounded-lg border border-danger/40 px-3 text-sm font-medium text-danger hover:bg-danger/10";
const CANCEL_BUTTON_CLASS = "inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted";
const CONFIRM_BUTTON_CLASS = "inline-flex h-9 items-center rounded-lg bg-danger px-3 text-sm font-medium text-primary-foreground";

function DeleteProduct({ product, onConfirm }: { product: Product; onConfirm: () => void }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={DANGER_BUTTON_CLASS}>Delete product</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 flex w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground shadow-lg">
          <AlertDialog.Title className="text-base font-semibold">Delete {product.name}?</AlertDialog.Title>
          <AlertDialog.Description className="text-muted-foreground">
            The product and its SKU {product.sku} are removed from the catalog. This cannot be undone.
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Close className={CANCEL_BUTTON_CLASS}>Cancel</AlertDialog.Close>
            <AlertDialog.Close className={CONFIRM_BUTTON_CLASS} onClick={onConfirm}>
              Delete
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { products } = useShop();
  const { updateProduct, deleteProduct } = useShopActions();
  const product = findProduct(products, params.id);

  if (!product) {
    return (
      <PageShell title="Product not found" description={`No product with id "${params.id}".`}>
        <Link href="/products" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Back to products
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell title={product.name} description={`${product.id} · ${product.sku}`} actions={<ProductStatusBadge status={product.status} />}>
      <ProductForm
        key={product.id}
        initial={product}
        submitLabel="Save product"
        onSubmit={(input) => {
          updateProduct(product.id, input);
          router.push("/products");
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <DeleteProduct
          product={product}
          onConfirm={() => {
            deleteProduct(product.id);
            router.push("/products");
          }}
        />
        <Link href="/products" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Back to products
        </Link>
      </div>
    </PageShell>
  );
}
