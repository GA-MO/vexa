import { OrderDetailPage } from "@/components/shop/order-detail-page";
import { ORDERS } from "@/lib/shop/data";

export function generateStaticParams() {
  return ORDERS.map((order) => ({ id: order.id }));
}

export default function OrderPage() {
  return <OrderDetailPage />;
}
