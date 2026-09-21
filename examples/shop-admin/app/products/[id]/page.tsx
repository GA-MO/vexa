import { ProductDetailPage } from "@/components/shop/product-detail-page";
import { PRODUCTS } from "@/lib/shop/data";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export default function ProductPage() {
  return <ProductDetailPage />;
}
