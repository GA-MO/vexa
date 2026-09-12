import type { Spec } from "@json-render/core";
import { interactiveSpec, specFromTree } from "./tree";

export type ComposedExample = {
  id: string;
  title: string;
  note: string;
  prompt: string;
  prose: string;
  spec: Spec;
};

export const COMPOSED_EXAMPLES: ComposedExample[] = [
  {
    id: "dashboard",
    title: "Sales dashboard",
    note: "Metric grid → horizontal BarChart → table in a Card → CTA row.",
    prompt: "สรุปยอดขายไตรมาสนี้ให้หน่อย เทียบกับปีที่แล้ว",
    prose:
      "ยอดขาย Q3 อยู่ที่ ฿2.4M โต 12% จากปีก่อน กรุงเทพยังเป็นภูมิภาคหลัก ส่วนภูเก็ตโตเร็วสุด",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "between", wrap: true },
          children: [
            { type: "Heading", props: { text: "Q3 sales", level: "2" } },
            { type: "Badge", props: { label: "Updated 09:00", tone: "success" } },
          ],
        },
        {
          type: "Grid",
          props: { columns: "3", gap: "md" },
          children: [
            { type: "Metric", props: { label: "Revenue", value: "฿2.4M", detail: "+12% YoY", trend: "up" } },
            { type: "Metric", props: { label: "Orders", value: "8,120", detail: "+6% YoY", trend: "up" } },
            { type: "Metric", props: { label: "Avg. order", value: "฿296", detail: "-2% YoY", trend: "down" } },
          ],
        },
        {
          type: "BarChart",
          props: {
            title: "Revenue by region",
            labels: ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen"],
            series: [
              { name: "2025", values: [1150000, 420000, 310000, 220000] },
              { name: "2026", values: [1280000, 460000, 410000, 250000] },
            ],
            horizontal: true,
            stacked: false,
            showValues: false,
            format: "currency",
            height: "md",
          },
        },
        {
          type: "Card",
          props: { title: "Top products", description: null },
          children: [
            {
              type: "Table",
              props: {
                columns: [
                  { key: "product", label: "Product" },
                  { key: "units", label: "Units" },
                  { key: "revenue", label: "Revenue" },
                ],
                rows: [
                  { product: "Pro plan", units: 1240, revenue: "฿1.23M" },
                  { product: "Team plan", units: 610, revenue: "฿0.72M" },
                  { product: "Add-ons", units: 2980, revenue: "฿0.45M" },
                ],
              },
            },
          ],
        },
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "end", wrap: true },
          children: [
            { type: "Button", props: { label: "Export CSV", variant: "secondary" } },
            { type: "Button", props: { label: "Open full report", variant: "primary" } },
          ],
        },
      ],
    }),
  },
  {
    id: "order-status",
    title: "Order status",
    note: "FromTo → KeyValue → Timeline → actions. The everyday support answer.",
    prompt: "ออเดอร์ #A-1042 ถึงไหนแล้ว",
    prose: "ออเดอร์ #A-1042 ออกจากคลังแล้วและกำลังจัดส่ง คาดว่าถึงวันนี้ก่อน 15:30 น.",
    spec: specFromTree({
      type: "Card",
      props: { title: "Order #A-1042", description: "Kerry Express · KEX-77193-TH" },
      children: [
        { type: "FromTo", props: { from: "Warehouse BKK", to: "Sukhumvit 24", via: "Kerry", icon: "truck" } },
        {
          type: "KeyValue",
          props: {
            pairs: [
              { label: "Status", value: "Out for delivery" },
              { label: "ETA", value: "Today, before 15:30" },
              { label: "Items", value: "3" },
              { label: "Total", value: "฿315.65 · paid" },
            ],
            size: "sm",
          },
        },
        {
          type: "Timeline",
          props: {
            items: [
              { title: "Order placed", detail: "Paid via PromptPay", time: "Mon 10:12" },
              { title: "Packed", detail: "Warehouse BKK", time: "Mon 16:40" },
              { title: "Out for delivery", detail: "Courier picked up", time: "Tue 08:05" },
              { title: "Delivered", detail: null, time: "—" },
            ],
          },
        },
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "end", wrap: true },
          children: [
            { type: "Button", props: { label: "Track on map", variant: "secondary" } },
            { type: "Button", props: { label: "Contact courier", variant: "primary" } },
          ],
        },
      ],
    }),
  },
  {
    id: "receipt",
    title: "Receipt",
    note: "LineItems with totals plus IconText pickup details.",
    prompt: "ขอสรุปบิลออเดอร์เมื่อกี้",
    prose: "นี่คือใบเสร็จของออเดอร์ #C-3381 รวม 3 รายการ ยอดสุทธิ ฿315.65",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "between", wrap: true },
          children: [
            { type: "Heading", props: { text: "Receipt #C-3381", level: "3" } },
            { type: "Badge", props: { label: "Paid", tone: "success" } },
          ],
        },
        {
          type: "LineItems",
          props: {
            items: [
              { name: "Latte", detail: "Oat milk, extra shot", qty: 2, amount: 180 },
              { name: "Croissant", detail: null, qty: 1, amount: 85 },
              { name: "Delivery", detail: "Within 3 km", qty: null, amount: 30 },
            ],
            summary: [
              { label: "Subtotal", amount: 295, emphasis: null },
              { label: "VAT 7%", amount: 20.65, emphasis: null },
              { label: "Total", amount: 315.65, emphasis: "total" },
            ],
            currency: "฿",
          },
        },
        {
          type: "Column",
          props: { gap: "xs", align: "stretch" },
          children: [
            { type: "IconText", props: { icon: "pin", text: "Vexa Café, 2nd floor", hint: "Pickup counter B" } },
            { type: "IconText", props: { icon: "clock", text: "Ready at 10:25", hint: null } },
            { type: "IconText", props: { icon: "receipt", text: "Tax invoice sent to alex@acme.com", hint: null } },
          ],
        },
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "end", wrap: true },
          children: [
            { type: "Button", props: { label: "Download PDF", variant: "secondary" } },
            { type: "Button", props: { label: "Reorder", variant: "primary" } },
          ],
        },
      ],
    }),
  },
  {
    id: "plan-compare",
    title: "Plan comparison",
    note: "Carousel of plan cards, a feature table, and a Callout recommendation.",
    prompt: "แพลนไหนเหมาะกับทีม 8 คน",
    prose: "ทีม 8 คนที่ต้องการ generative UI แนะนำ Pro เพราะ Team ยังไม่มี SSO และ Enterprise เกินความจำเป็น",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Carousel",
          props: {
            variant: "card",
            items: [
              { src: null, alt: null, caption: null, title: "Free", description: "1 workspace · 3 seats · community support", badge: null },
              { src: null, alt: null, caption: null, title: "Pro · ฿990/mo", description: "Unlimited workspaces · generative UI · SSO", badge: "Recommended" },
              { src: null, alt: null, caption: null, title: "Enterprise", description: "SLA · audit log · dedicated support", badge: null },
            ],
          },
        },
        {
          type: "Table",
          props: {
            columns: [
              { key: "feature", label: "Feature" },
              { key: "free", label: "Free" },
              { key: "pro", label: "Pro" },
              { key: "ent", label: "Enterprise" },
            ],
            rows: [
              { feature: "Seats", free: "3", pro: "Up to 25", ent: "Unlimited" },
              { feature: "Generative UI", free: "—", pro: "✓", ent: "✓" },
              { feature: "SSO", free: "—", pro: "✓", ent: "✓" },
              { feature: "SLA", free: "—", pro: "—", ent: "99.9%" },
            ],
          },
        },
        {
          type: "Callout",
          props: {
            eyebrow: "Recommendation",
            title: "Go with Pro",
            body: "8 seats fits comfortably under the 25-seat cap, and you get SSO without paying for an SLA you don't need yet.",
            tone: "brand",
          },
        },
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "end", wrap: true },
          children: [
            { type: "Button", props: { label: "Compare all features", variant: "secondary" } },
            { type: "Button", props: { label: "Start Pro trial", variant: "primary" } },
          ],
        },
      ],
    }),
  },
  {
    id: "booking",
    title: "Booking form",
    note: "Collect values with Select / RadioGroup / Input / Switch, then validate + submit. Fully interactive.",
    prompt: "จองห้องประชุมพรุ่งนี้บ่ายให้หน่อย",
    prose: "ได้เลย กรอกรายละเอียดด้านล่างแล้วกดยืนยัน ระบบจะจองและส่งคำเชิญให้ทันที",
    spec: interactiveSpec(
      {
        type: "Card",
        props: { title: "Book a meeting room", description: "Tomorrow · 13:00–15:00" },
        children: [
          {
            type: "Grid",
            props: { columns: "2", gap: "md" },
            children: [
              {
                type: "Select",
                props: {
                  label: "Room",
                  name: "room",
                  placeholder: "Choose a room",
                  options: [
                    { value: "orchid", label: "Orchid · 6 seats" },
                    { value: "lotus", label: "Lotus · 10 seats" },
                    { value: "bamboo", label: "Bamboo · 16 seats" },
                  ],
                  value: { $bindState: "/form/room" },
                  disabled: false,
                },
              },
              {
                type: "Input",
                props: {
                  label: "Attendees",
                  name: "attendees",
                  placeholder: "8",
                  inputType: "number",
                  value: { $bindState: "/form/attendees" },
                  checks: [{ type: "required", message: "How many people?", args: null }],
                  validateOn: "blur",
                },
              },
            ],
          },
          {
            type: "RadioGroup",
            props: {
              label: "Setup",
              name: "setup",
              options: [
                { value: "boardroom", label: "Boardroom" },
                { value: "classroom", label: "Classroom" },
                { value: "standing", label: "Standing / workshop" },
              ],
              value: { $bindState: "/form/setup" },
              disabled: false,
            },
          },
          {
            type: "Switch",
            props: {
              label: "Order coffee & snacks",
              name: "catering",
              hint: "Billed to your cost center",
              checked: { $bindState: "/form/catering" },
              disabled: false,
            },
          },
          {
            type: "Input",
            props: {
              label: "Meeting title",
              name: "title",
              placeholder: "Q4 planning",
              inputType: "text",
              value: { $bindState: "/form/title" },
              checks: [{ type: "required", message: "Give the meeting a title", args: null }],
              validateOn: "blur",
            },
          },
          {
            type: "Row",
            props: { gap: "sm", align: "center", justify: "end", wrap: true },
            children: [
              {
                type: "Button",
                props: { label: "Confirm booking", variant: "primary" },
                on: {
                  press: [
                    { action: "validateForm", params: { statePath: "/formResult" } },
                    { action: "submitForm", params: { statePath: "/lastSubmit" } },
                    { action: "toast", params: { message: "Room booked — invites sent" } },
                  ],
                },
              },
            ],
          },
          {
            type: "Alert",
            props: {
              title: { $state: "/toast" },
              body: { $template: "${/form/title} · ${/form/room} · ${/form/attendees} people · ${/form/setup}" },
              tone: "success",
            },
            visible: { $state: "/toast" },
          },
        ],
      },
      {
        form: { room: "lotus", attendees: "8", setup: "boardroom", catering: true, title: "" },
        toast: "",
        formResult: null,
        lastSubmit: null,
      },
    ),
  },
  {
    id: "recommendation",
    title: "Place recommendation",
    note: "Image, Rating, IconText contact rows, and tags in one Card.",
    prompt: "หาคาเฟ่ใกล้อโศกที่นั่งทำงานได้",
    prose: "แนะนำ Vexa Café ห่างจาก BTS อโศก 3 นาที มีปลั๊กทุกโต๊ะและ Wi-Fi เร็ว รีวิว 4.6 จาก 1,280 คน",
    spec: specFromTree({
      type: "Card",
      props: { title: null, description: null },
      children: [
        {
          type: "Image",
          props: {
            src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
            alt: "Café interior with long tables",
            caption: null,
            aspect: "wide",
          },
        },
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "between", wrap: true },
          children: [
            { type: "Heading", props: { text: "Vexa Café", level: "3" } },
            { type: "Badge", props: { label: "Open now", tone: "success" } },
          ],
        },
        { type: "Rating", props: { label: null, value: 4.6, max: 5, count: 1280, showValue: true } },
        {
          type: "Row",
          props: { gap: "xs", align: "center", justify: "start", wrap: true },
          children: [
            { type: "Badge", props: { label: "Power outlets", tone: "neutral" } },
            { type: "Badge", props: { label: "Fast Wi-Fi", tone: "neutral" } },
            { type: "Badge", props: { label: "Quiet zone", tone: "neutral" } },
          ],
        },
        {
          type: "Column",
          props: { gap: "xs", align: "stretch" },
          children: [
            { type: "IconText", props: { icon: "pin", text: "99 Sukhumvit Rd, 2nd floor", hint: "3 min walk from BTS Asok" } },
            { type: "IconText", props: { icon: "clock", text: "08:00 – 21:00", hint: "Last order 20:30" } },
            { type: "IconText", props: { icon: "phone", text: "02-123-4567", hint: null } },
          ],
        },
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "end", wrap: true },
          children: [
            { type: "Button", props: { label: "Directions", variant: "secondary" } },
            { type: "Button", props: { label: "Reserve a table", variant: "primary" } },
          ],
        },
      ],
    }),
  },
  {
    id: "trend-report",
    title: "Trend report",
    note: "LineChart with two series, supporting Metrics, and an Alert with the insight.",
    prompt: "conversion rate เดือนนี้เป็นยังไง",
    prose: "Conversion ฝั่ง app แซง web ตั้งแต่กลางเดือน เฉลี่ยทั้งเดือนอยู่ที่ 3.3% เทียบกับ web 2.7%",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Grid",
          props: { columns: "3", gap: "md" },
          children: [
            { type: "Metric", props: { label: "App", value: "3.3%", detail: "+0.4 pt MoM", trend: "up" } },
            { type: "Metric", props: { label: "Web", value: "2.7%", detail: "-0.1 pt MoM", trend: "down" } },
            { type: "Metric", props: { label: "Blended", value: "3.0%", detail: "Flat", trend: "neutral" } },
          ],
        },
        {
          type: "LineChart",
          props: {
            title: "Daily conversion rate · August",
            labels: Array.from({ length: 31 }, (_, i) => `${i + 1}`),
            series: [
              {
                name: "App",
                values: Array.from({ length: 31 }, (_, i) =>
                  Math.round((2.8 + i * 0.03 + Math.sin(i / 3) * 0.25) * 100) / 100,
                ),
              },
              {
                name: "Web",
                values: Array.from({ length: 31 }, (_, i) =>
                  Math.round((2.9 - i * 0.012 + Math.cos(i / 4) * 0.2) * 100) / 100,
                ),
              },
            ],
            area: false,
            showDots: false,
            format: "percent",
            height: "md",
          },
        },
        {
          type: "Alert",
          props: {
            title: "What changed",
            body: "The app checkout redesign shipped on the 14th; app conversion has stayed above web every day since.",
            tone: "info",
          },
        },
      ],
    }),
  },
];
