export const STATUSES = ["pending", "paid", "shipped", "delivered", "refunded"] as const;
export const CITIES = ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen"] as const;

export type Status = (typeof STATUSES)[number];
export type City = (typeof CITIES)[number];

export const LOCALES = ["en-US", "de-DE"] as const;
export const CURRENCIES = ["USD", "EUR"] as const;
export const THEMES = ["light", "dark"] as const;
export const STEPS_MODES = ["collapsible", "hidden"] as const;

export const CATEGORIES = ["Beans", "Equipment", "Accessories", "Merch"] as const;
export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;

export type Category = (typeof CATEGORIES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: Category;
  status: ProductStatus;
};

export type ProductInput = Omit<Product, "id">;

export type Locale = (typeof LOCALES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type Theme = (typeof THEMES)[number];
export type StepsMode = (typeof STEPS_MODES)[number];
export type StatusFilter = Status | "all";

export type ShopFilters = { status: StatusFilter; search: string };

export type OrderItem = { name: string; qty: number; price: number };
export type TimelineEvent = { title: string; detail?: string; at: string };

export type Order = {
  id: string;
  customer: string;
  city: City;
  status: Status;
  items: OrderItem[];
  createdAt: string;
  timeline: TimelineEvent[];
};

export type OrderTotals = { subtotal: number; shipping: number; total: number; itemCount: number };

export type ShopMetrics = {
  revenue: number;
  orderCount: number;
  pendingCount: number;
  averageOrderValue: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const FREE_SHIPPING_FROM = 1500;
const SHIPPING_FEE = 60;

const STATUS_STEPS: Record<Status, number> = { pending: 1, paid: 2, shipped: 3, delivered: 4, refunded: 5 };

const ITEM_PRICES: Record<string, number> = {
  "Cold brew concentrate 1L": 320,
  "Single-origin beans 250g": 390,
  "Ceramic pour-over set": 1290,
  "Oat milk 6-pack": 420,
  "Espresso tamper": 750,
  "Reusable filter": 180,
  "Gooseneck kettle": 1890,
  "Matcha starter kit": 980,
  "Drip bag sampler": 260,
  "Insulated tumbler": 590,
};

type Seed = {
  id: string;
  customer: string;
  city: City;
  status: Status;
  daysAgo: number;
  hour: number;
  items: Array<[keyof typeof ITEM_PRICES, number]>;
};

const SEEDS: Seed[] = [
  { id: "C-1042", customer: "Napat Srisuwan", city: "Bangkok", status: "pending", daysAgo: 1, hour: 9, items: [["Ceramic pour-over set", 1], ["Single-origin beans 250g", 2]] },
  { id: "C-1041", customer: "Ploy Chaiyaporn", city: "Chiang Mai", status: "paid", daysAgo: 1, hour: 14, items: [["Cold brew concentrate 1L", 3]] },
  { id: "C-1040", customer: "Ben Carter", city: "Phuket", status: "shipped", daysAgo: 2, hour: 11, items: [["Gooseneck kettle", 1], ["Reusable filter", 2]] },
  { id: "C-1039", customer: "Kanya Thongdee", city: "Bangkok", status: "pending", daysAgo: 2, hour: 16, items: [["Oat milk 6-pack", 2], ["Drip bag sampler", 1]] },
  { id: "C-1038", customer: "Somchai Prasert", city: "Khon Kaen", status: "delivered", daysAgo: 3, hour: 10, items: [["Matcha starter kit", 1]] },
  { id: "C-1037", customer: "Mia Lindqvist", city: "Bangkok", status: "paid", daysAgo: 4, hour: 8, items: [["Insulated tumbler", 2], ["Single-origin beans 250g", 1]] },
  { id: "C-1036", customer: "Arthit Wongsa", city: "Chiang Mai", status: "delivered", daysAgo: 5, hour: 13, items: [["Espresso tamper", 1], ["Reusable filter", 1]] },
  { id: "C-1035", customer: "Fah Rattanakul", city: "Phuket", status: "refunded", daysAgo: 6, hour: 15, items: [["Cold brew concentrate 1L", 2]] },
  { id: "C-1034", customer: "Liam O'Neill", city: "Bangkok", status: "shipped", daysAgo: 7, hour: 9, items: [["Gooseneck kettle", 1]] },
  { id: "C-1033", customer: "Nisa Boonmee", city: "Khon Kaen", status: "delivered", daysAgo: 8, hour: 12, items: [["Drip bag sampler", 4]] },
  { id: "C-1032", customer: "Tanawat Kaewsri", city: "Bangkok", status: "delivered", daysAgo: 9, hour: 17, items: [["Ceramic pour-over set", 1], ["Oat milk 6-pack", 1]] },
  { id: "C-1031", customer: "Sara Kim", city: "Chiang Mai", status: "pending", daysAgo: 10, hour: 10, items: [["Matcha starter kit", 2]] },
  { id: "C-1030", customer: "Pim Suksawat", city: "Phuket", status: "delivered", daysAgo: 11, hour: 11, items: [["Insulated tumbler", 1], ["Drip bag sampler", 2]] },
  { id: "C-1029", customer: "Chanon Metha", city: "Bangkok", status: "paid", daysAgo: 12, hour: 14, items: [["Single-origin beans 250g", 4]] },
  { id: "C-1028", customer: "Anna Weber", city: "Khon Kaen", status: "shipped", daysAgo: 13, hour: 9, items: [["Espresso tamper", 1], ["Single-origin beans 250g", 2]] },
  { id: "C-1027", customer: "Wichai Panya", city: "Bangkok", status: "delivered", daysAgo: 15, hour: 16, items: [["Cold brew concentrate 1L", 1], ["Reusable filter", 3]] },
  { id: "C-1026", customer: "Dao Phromma", city: "Chiang Mai", status: "refunded", daysAgo: 16, hour: 13, items: [["Gooseneck kettle", 1]] },
  { id: "C-1025", customer: "Jun Park", city: "Phuket", status: "delivered", daysAgo: 18, hour: 10, items: [["Oat milk 6-pack", 3]] },
  { id: "C-1024", customer: "Malee Jitpakdee", city: "Bangkok", status: "delivered", daysAgo: 20, hour: 15, items: [["Matcha starter kit", 1], ["Insulated tumbler", 1]] },
  { id: "C-1023", customer: "Oliver Grant", city: "Khon Kaen", status: "pending", daysAgo: 22, hour: 8, items: [["Drip bag sampler", 1]] },
  { id: "C-1022", customer: "Preeda Yotha", city: "Bangkok", status: "delivered", daysAgo: 24, hour: 12, items: [["Ceramic pour-over set", 2]] },
  { id: "C-1021", customer: "Nok Sirikarn", city: "Chiang Mai", status: "delivered", daysAgo: 26, hour: 11, items: [["Cold brew concentrate 1L", 2], ["Oat milk 6-pack", 1]] },
  { id: "C-1020", customer: "Emma Fischer", city: "Phuket", status: "shipped", daysAgo: 27, hour: 17, items: [["Espresso tamper", 2]] },
  { id: "C-1019", customer: "Krit Suwannarat", city: "Bangkok", status: "delivered", daysAgo: 29, hour: 9, items: [["Single-origin beans 250g", 3], ["Reusable filter", 1]] },
];

function startOfTodayUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

const ANCHOR = startOfTodayUtc();

function iso(ms: number) {
  return new Date(ms).toISOString();
}

function buildTimeline(seed: Seed, createdAt: number, total: number): TimelineEvent[] {
  const steps = STATUS_STEPS[seed.status];
  const events: TimelineEvent[] = [
    { title: "Order placed", detail: `${seed.items.length} line item${seed.items.length === 1 ? "" : "s"}`, at: iso(createdAt) },
  ];
  if (steps >= 2) events.push({ title: "Payment received", detail: `Card, ${total.toFixed(0)} charged`, at: iso(createdAt + 1 * HOUR) });
  if (steps >= 3) events.push({ title: "Packed", detail: `${seed.city} fulfilment centre`, at: iso(createdAt + 20 * HOUR) });
  if (steps >= 3) events.push({ title: "Shipped", detail: "Kerry Express", at: iso(createdAt + 26 * HOUR) });
  if (steps >= 4) events.push({ title: "Delivered", detail: "Signed by the customer", at: iso(createdAt + 50 * HOUR) });
  if (steps === 5) events.push({ title: "Refunded", detail: "Customer request", at: iso(createdAt + 72 * HOUR) });
  return events;
}

function buildOrder(seed: Seed): Order {
  const createdAt = ANCHOR - seed.daysAgo * DAY + seed.hour * HOUR;
  const items = seed.items.map(([name, qty]) => ({ name, qty, price: ITEM_PRICES[name] }));
  const total = totals({ items }).total;
  return {
    id: seed.id,
    customer: seed.customer,
    city: seed.city,
    status: seed.status,
    items,
    createdAt: iso(createdAt),
    timeline: buildTimeline(seed, createdAt, total),
  };
}

export const ORDERS: Order[] = SEEDS.map(buildOrder);

export const PRODUCTS: Product[] = [
  { id: "P-1001", name: "Single-origin beans 250g", sku: "BN-250", price: 390, category: "Beans", status: "active" },
  { id: "P-1002", name: "Cold brew concentrate 1L", sku: "CB-1000", price: 320, category: "Beans", status: "active" },
  { id: "P-1003", name: "Drip bag sampler", sku: "DB-010", price: 260, category: "Beans", status: "draft" },
  { id: "P-1004", name: "Gooseneck kettle", sku: "EQ-KET", price: 1890, category: "Equipment", status: "active" },
  { id: "P-1005", name: "Ceramic pour-over set", sku: "EQ-POS", price: 1290, category: "Equipment", status: "active" },
  { id: "P-1006", name: "Espresso tamper", sku: "EQ-TMP", price: 750, category: "Equipment", status: "archived" },
  { id: "P-1007", name: "Reusable filter", sku: "AC-FLT", price: 180, category: "Accessories", status: "active" },
  { id: "P-1008", name: "Insulated tumbler", sku: "MR-TUM", price: 590, category: "Merch", status: "active" },
  { id: "P-1009", name: "Electric kettle", sku: "EQ-EKT", price: 1450, category: "Equipment", status: "active" },
];

export function findProduct(products: Product[], id: string): Product | undefined {
  return products.find((product) => product.id.toLowerCase() === id.trim().toLowerCase());
}

export function nextProductId(products: Product[]): string {
  const highest = products.reduce((max, product) => Math.max(max, Number(product.id.replace(/\D/g, "")) || 0), 1000);
  return `P-${highest + 1}`;
}

export function filterProducts(products: Product[], search: string): Product[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return products;
  return products.filter((product) => [product.name, product.sku, product.category].some((field) => field.toLowerCase().includes(needle)));
}

export function totals(order: Pick<Order, "items">): OrderTotals {
  const subtotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping, itemCount };
}

export function findOrder(orders: Order[], id: string): Order | undefined {
  return orders.find((order) => order.id.toLowerCase() === id.trim().toLowerCase());
}

function countsTowardRevenue(order: Order) {
  return order.status !== "refunded" && order.status !== "pending";
}

function monthLabel(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function revenueByMonth(orders: Order[]): Array<{ month: string; revenue: number }> {
  const byMonth = new Map<string, number>();
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const order of sorted) {
    const label = monthLabel(order.createdAt);
    const revenue = countsTowardRevenue(order) ? totals(order).total : 0;
    byMonth.set(label, (byMonth.get(label) ?? 0) + revenue);
  }
  return [...byMonth.entries()].map(([month, revenue]) => ({ month, revenue }));
}

export function metrics(orders: Order[]): ShopMetrics {
  const paidOrders = orders.filter(countsTowardRevenue);
  const revenue = paidOrders.reduce((sum, order) => sum + totals(order).total, 0);
  return {
    revenue,
    orderCount: orders.length,
    pendingCount: orders.filter((order) => order.status === "pending").length,
    averageOrderValue: paidOrders.length === 0 ? 0 : revenue / paidOrders.length,
  };
}

export function recentOrders(orders: Order[], limit: number): Order[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function filterOrders(orders: Order[], filters: ShopFilters): Order[] {
  const search = filters.search.trim().toLowerCase();
  return orders.filter((order) => {
    if (filters.status !== "all" && order.status !== filters.status) return false;
    if (!search) return true;
    return [order.id, order.customer, order.city].some((field) => field.toLowerCase().includes(search));
  });
}
