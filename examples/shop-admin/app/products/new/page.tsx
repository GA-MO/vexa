"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/shop/page-shell";
import { EMPTY_PRODUCT, ProductForm } from "@/components/shop/product-form";
import { useShopActions } from "@/lib/shop/store";

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useShopActions();
  return (
    <PageShell title="New product" description="Every field is a plain labelled control, which is all the chat needs to fill it.">
      <ProductForm
        initial={EMPTY_PRODUCT}
        submitLabel="Create product"
        onSubmit={(input) => {
          addProduct(input);
          router.push("/products");
        }}
      />
    </PageShell>
  );
}
