import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: z.object({
        direction: z.enum(["vertical", "horizontal"]).nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      slots: ["default"],
      description: "Flex stack for grouping children",
      example: { direction: "vertical", gap: "md" },
    },
    Card: {
      props: z.object({
        title: z.string().nullable(),
        description: z.string().nullable(),
      }),
      slots: ["default"],
      description: "Elevated surface for related content. Never nest Card in Card.",
      example: {
        title: "Overview",
        description: "Key metrics for this week",
      },
    },
    Grid: {
      props: z.object({
        columns: z.enum(["1", "2", "3", "4"]).nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      slots: ["default"],
      description: "Responsive multi-column grid",
      example: { columns: "2", gap: "md" },
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(["1", "2", "3"]).nullable(),
      }),
      description: "Section heading",
      example: { text: "Revenue", level: "2" },
    },
    Text: {
      props: z.object({
        content: z.string(),
        muted: z.boolean().nullable(),
      }),
      description: "Body copy",
      example: { content: "Here is a short summary.", muted: false },
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().nullable(),
        trend: z.enum(["up", "down", "neutral"]).nullable(),
      }),
      description: "Single KPI with optional trend",
      example: {
        label: "Users",
        value: "12,480",
        detail: "+8% vs last week",
        trend: "up",
      },
    },
    Badge: {
      props: z.object({
        label: z.string(),
        tone: z.enum(["neutral", "success", "warning", "danger"]).nullable(),
      }),
      description: "Compact status pill",
      example: { label: "Live", tone: "success" },
    },
    Alert: {
      props: z.object({
        title: z.string().nullable(),
        body: z.string(),
        tone: z.enum(["info", "success", "warning", "danger"]).nullable(),
      }),
      description: "Callout for tips, warnings, or errors",
      example: {
        title: "Tip",
        body: "Ask for a dashboard to get visual cards.",
        tone: "info",
      },
    },
    Separator: {
      props: z.object({}),
      description: "Horizontal divider",
      example: {},
    },
    Table: {
      props: z.object({
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
          }),
        ),
        rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
      }),
      description: "Simple data table",
      example: {
        columns: [
          { key: "name", label: "Name" },
          { key: "score", label: "Score" },
        ],
        rows: [{ name: "Alpha", score: 92 }],
      },
    },
    List: {
      props: z.object({
        items: z.array(z.string()),
        ordered: z.boolean().nullable(),
      }),
      description: "Bullet or numbered list",
      example: { items: ["Plan", "Build", "Ship"], ordered: true },
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary"]).nullable(),
      }),
      description: "Action button. Prefer primary for the main CTA.",
      example: { label: "Continue", variant: "primary" },
    },
    Chart: {
      props: z.object({
        title: z.string().nullable(),
        kind: z.enum(["bar", "line", "pie", "spark"]).nullable(),
        points: z.array(
          z.object({
            label: z.string(),
            value: z.number(),
          }),
        ),
      }),
      description:
        "Bar for comparisons, line for trends, pie for share of total, spark for a compact inline trend",
      example: {
        title: "Revenue",
        kind: "bar",
        points: [
          { label: "Q1", value: 12 },
          { label: "Q2", value: 18 },
        ],
      },
    },
    Image: {
      props: z.object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().nullable(),
        aspect: z.enum(["wide", "square", "tall"]).nullable(),
      }),
      description: "Image with optional caption",
      example: {
        src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        alt: "Analytics dashboard",
        caption: "Sample product visual",
        aspect: "wide",
      },
    },
    Tabs: {
      props: z.object({
        items: z.array(
          z.object({
            label: z.string(),
            content: z.string(),
          }),
        ),
      }),
      description: "Tabbed text panels for switching related views",
      example: {
        items: [
          { label: "Overview", content: "High-level summary." },
          { label: "Details", content: "Supporting detail." },
        ],
      },
    },
    Progress: {
      props: z.object({
        label: z.string(),
        value: z.number(),
        detail: z.string().nullable(),
      }),
      description: "Progress bar from 0 to 100",
      example: { label: "Onboarding", value: 65, detail: "3 of 5 steps" },
    },
    Timeline: {
      props: z.object({
        items: z.array(
          z.object({
            title: z.string(),
            detail: z.string().nullable(),
            time: z.string().nullable(),
          }),
        ),
      }),
      description: "Vertical timeline for events or roadmap steps",
      example: {
        items: [
          {
            title: "Kickoff",
            detail: "Align goals",
            time: "Mon",
          },
        ],
      },
    },
    Input: {
      props: z.object({
        label: z.string(),
        name: z.string(),
        placeholder: z.string().nullable(),
        inputType: z
          .enum(["text", "email", "number", "textarea"])
          .nullable(),
        value: z.string().nullable(),
        checks: z
          .array(
            z.object({
              type: z.string(),
              message: z.string(),
              args: z
                .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
                .nullable(),
            }),
          )
          .nullable(),
        validateOn: z.enum(["change", "blur", "submit"]).nullable(),
      }),
      description:
        "Labeled field. Bind with value: { $bindState: '/form/email' }. Optional checks for validation.",
      example: {
        label: "Email",
        name: "email",
        placeholder: "you@company.com",
        inputType: "email",
        value: null,
        checks: [
          { type: "required", message: "Email is required", args: null },
          { type: "email", message: "Invalid email", args: null },
        ],
        validateOn: "blur",
      },
    },
    Form: {
      props: z.object({
        title: z.string().nullable(),
        submitLabel: z.string().nullable(),
        fields: z.array(
          z.object({
            label: z.string(),
            name: z.string(),
            placeholder: z.string().nullable(),
            inputType: z
              .enum(["text", "email", "number", "textarea"])
              .nullable(),
          }),
        ),
      }),
      description:
        "Convenience form with fields bound under /form/{name}. Prefer Stack of Input + Button for idiomatic binding.",
      example: {
        title: "Request access",
        submitLabel: "Submit",
        fields: [
          {
            label: "Name",
            name: "name",
            placeholder: "Alex",
            inputType: "text",
          },
        ],
      },
    },
    Avatar: {
      props: z.object({
        name: z.string(),
        role: z.string().nullable(),
        src: z.string().nullable(),
        size: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      description: "Person avatar with name and optional role",
      example: {
        name: "Alex Kim",
        role: "Owner",
        src: null,
        size: "md",
      },
    },
    Code: {
      props: z.object({
        code: z.string(),
        language: z.string().nullable(),
        filename: z.string().nullable(),
      }),
      description: "Code snippet block for examples and configs",
      example: {
        code: "console.log('hello')",
        language: "ts",
        filename: "main.ts",
      },
    },
    Map: {
      props: z.object({
        title: z.string().nullable(),
        latitude: z.number(),
        longitude: z.number(),
        zoom: z.number().nullable(),
        markers: z
          .array(
            z.object({
              label: z.string(),
              latitude: z.number(),
              longitude: z.number(),
            }),
          )
          .nullable(),
      }),
      description:
        "Location map with center coordinates and optional labeled markers",
      example: {
        title: "Bangkok HQ",
        latitude: 13.7563,
        longitude: 100.5018,
        zoom: 12,
        markers: [
          {
            label: "HQ",
            latitude: 13.7563,
            longitude: 100.5018,
          },
        ],
      },
    },
    Carousel: {
      props: z.object({
        variant: z.enum(["image", "card"]).nullable(),
        items: z.array(
          z.object({
            src: z.string().nullable(),
            alt: z.string().nullable(),
            caption: z.string().nullable(),
            title: z.string().nullable(),
            description: z.string().nullable(),
            badge: z.string().nullable(),
          }),
        ),
      }),
      description:
        "Free-scroll swipeable strip. Use variant='image' for galleries or variant='card' for plan/feature cards.",
      example: {
        variant: "card",
        items: [
          {
            src: null,
            alt: null,
            caption: null,
            title: "Pro",
            description: "Generative UI for teams",
            badge: "Popular",
          },
        ],
      },
    },
    Callout: {
      props: z.object({
        eyebrow: z.string().nullable(),
        title: z.string(),
        body: z.string(),
        tone: z
          .enum(["brand", "info", "success", "warning", "danger"])
          .nullable(),
      }),
      description:
        "Prominent highlighted callout for key takeaways. Prefer over Alert when the message should stand out.",
      example: {
        eyebrow: "Tip",
        title: "Ask for a carousel of plans",
        body: "Use Carousel variant='card' for side-by-side plan cards you can swipe.",
        tone: "brand",
      },
    },
    Accordion: {
      props: z.object({
        items: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
          }),
        ),
      }),
      description: "Expandable FAQ or policy sections for dense text",
      example: {
        items: [
          {
            title: "What is Vexa?",
            content: "Chat that can emit constrained generative UI.",
          },
        ],
      },
    },
    Video: {
      props: z.object({
        src: z.string(),
        poster: z.string().nullable(),
        caption: z.string().nullable(),
        aspect: z.enum(["wide", "square", "tall"]).nullable(),
      }),
      description: "Embedded video clip for demos and walkthroughs",
      example: {
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster: null,
        caption: "Sample walkthrough",
        aspect: "wide",
      },
    },
    Checkbox: {
      props: z.object({
        label: z.string(),
        name: z.string(),
        hint: z.string().nullable(),
        checked: z.boolean().nullable(),
        disabled: z.boolean().nullable(),
      }),
      description:
        "Single boolean checkbox with label. Bind with checked: { $bindState: '/form/agree' }.",
      example: {
        label: "I agree to the terms",
        name: "agree",
        hint: null,
        checked: false,
        disabled: false,
      },
    },
    Switch: {
      props: z.object({
        label: z.string(),
        name: z.string(),
        hint: z.string().nullable(),
        checked: z.boolean().nullable(),
        disabled: z.boolean().nullable(),
      }),
      description:
        "Toggle switch for on/off settings. Bind with checked: { $bindState: '/settings/notify' }.",
      example: {
        label: "Email notifications",
        name: "notify",
        hint: "Send a digest every morning",
        checked: true,
        disabled: false,
      },
    },
    RadioGroup: {
      props: z.object({
        label: z.string().nullable(),
        name: z.string(),
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        value: z.string().nullable(),
        disabled: z.boolean().nullable(),
      }),
      description:
        "Pick exactly one option from 2-6 choices. Bind with value: { $bindState: '/form/plan' }.",
      example: {
        label: "Plan",
        name: "plan",
        options: [
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro" },
        ],
        value: "pro",
        disabled: false,
      },
    },
    Select: {
      props: z.object({
        label: z.string().nullable(),
        name: z.string(),
        placeholder: z.string().nullable(),
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        value: z.string().nullable(),
        disabled: z.boolean().nullable(),
      }),
      description:
        "Dropdown for choosing one option from a longer list. Bind with value: { $bindState: '/form/country' }.",
      example: {
        label: "Country",
        name: "country",
        placeholder: "Choose a country",
        options: [
          { value: "th", label: "Thailand" },
          { value: "sg", label: "Singapore" },
        ],
        value: null,
        disabled: false,
      },
    },
    Rating: {
      props: z.object({
        label: z.string().nullable(),
        value: z.number(),
        max: z.number().nullable(),
        count: z.number().nullable(),
        showValue: z.boolean().nullable(),
      }),
      description:
        "Star rating display (supports half stars) with optional review count. Read-only.",
      example: {
        label: "Customer rating",
        value: 4.5,
        max: 5,
        count: 1280,
        showValue: true,
      },
    },
    Divider: {
      props: z.object({
        label: z.string().nullable(),
      }),
      description: "Horizontal divider with optional centered label (e.g. 'or', 'Today')",
      example: { label: "Today" },
    },
    Column: {
      props: z.object({
        gap: z.enum(["none", "xs", "sm", "md", "lg"]).nullable(),
        align: z.enum(["start", "center", "end", "stretch"]).nullable(),
      }),
      slots: ["default"],
      description: "Lay children out top-to-bottom. Tighter than Stack; use for dense groups.",
      example: { gap: "sm", align: "stretch" },
    },
    Row: {
      props: z.object({
        gap: z.enum(["none", "xs", "sm", "md", "lg"]).nullable(),
        align: z.enum(["start", "center", "end", "stretch"]).nullable(),
        justify: z.enum(["start", "center", "end", "between"]).nullable(),
        wrap: z.boolean().nullable(),
      }),
      slots: ["default"],
      description:
        "Lay children out left-to-right; wraps on narrow widths unless wrap=false. Use justify='between' for label/value pairs.",
      example: { gap: "sm", align: "center", justify: "between", wrap: true },
    },
    BarChart: {
      props: z.object({
        title: z.string().nullable(),
        labels: z.array(z.string()),
        series: z.array(
          z.object({
            name: z.string(),
            values: z.array(z.number()),
          }),
        ),
        horizontal: z.boolean().nullable(),
        stacked: z.boolean().nullable(),
        showValues: z.boolean().nullable(),
        format: z.enum(["number", "currency", "percent"]).nullable(),
        height: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      description:
        "Bar chart comparing categories. 1-4 series (values align with labels). horizontal=true reads best in chat; stacked=true for part-of-whole.",
      example: {
        title: "Sales by region",
        labels: ["Bangkok", "Chiang Mai", "Phuket"],
        series: [
          { name: "2025", values: [120, 80, 64] },
          { name: "2026", values: [150, 92, 71] },
        ],
        horizontal: true,
        stacked: false,
        showValues: true,
        format: "number",
        height: "md",
      },
    },
    LineChart: {
      props: z.object({
        title: z.string().nullable(),
        labels: z.array(z.string()),
        series: z.array(
          z.object({
            name: z.string(),
            values: z.array(z.number()),
          }),
        ),
        area: z.boolean().nullable(),
        showDots: z.boolean().nullable(),
        format: z.enum(["number", "currency", "percent"]).nullable(),
        height: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      description:
        "Line chart for trends over time. 1-4 series; handles 14-60 points and thins axis labels automatically. area=true fills under the line.",
      example: {
        title: "Weekly active users",
        labels: ["W1", "W2", "W3", "W4"],
        series: [{ name: "Users", values: [420, 480, 465, 530] }],
        area: true,
        showDots: true,
        format: "number",
        height: "md",
      },
    },
    Icon: {
      props: z.object({
        name: z.enum([
          "phone", "mail", "pin", "clock", "star", "check", "alert", "plane", "cart", "user",
          "calendar", "tag", "box", "receipt", "truck", "arrowRight", "arrowLeft", "search", "edit", "trash",
          "info", "play", "music", "coffee", "home", "chart", "list", "send", "heart",
        ]),
        tone: z.enum(["default", "muted", "primary", "success", "warning", "danger"]).nullable(),
        size: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      description: "Single decorative icon next to a heading or inside a Row (not a button)",
      example: { name: "truck", tone: "primary", size: "md" },
    },
    IconText: {
      props: z.object({
        icon: z.enum([
          "phone", "mail", "pin", "clock", "star", "check", "alert", "plane", "cart", "user",
          "calendar", "tag", "box", "receipt", "truck", "arrowRight", "arrowLeft", "search", "edit", "trash",
          "info", "play", "music", "coffee", "home", "chart", "list", "send", "heart",
        ]),
        text: z.string(),
        hint: z.string().nullable(),
      }),
      description: "Icon + text row for contact details, addresses, opening hours",
      example: { icon: "phone", text: "02-123-4567", hint: "Mon-Fri 9:00-18:00" },
    },
    LineItems: {
      props: z.object({
        items: z.array(
          z.object({
            name: z.string(),
            detail: z.string().nullable(),
            qty: z.number().nullable(),
            amount: z.number(),
          }),
        ),
        summary: z
          .array(
            z.object({
              label: z.string(),
              amount: z.number(),
              emphasis: z.enum(["total"]).nullable(),
            }),
          )
          .nullable(),
        currency: z.string().nullable(),
      }),
      description:
        "Receipt/order lines with qty x name and amount, plus summary lines (subtotal, tax, total). currency is a prefix symbol, default ฿.",
      example: {
        items: [
          { name: "Latte", detail: "Oat milk", qty: 2, amount: 180 },
          { name: "Croissant", detail: null, qty: 1, amount: 85 },
        ],
        summary: [
          { label: "Subtotal", amount: 265, emphasis: null },
          { label: "VAT 7%", amount: 18.55, emphasis: null },
          { label: "Total", amount: 283.55, emphasis: "total" },
        ],
        currency: "฿",
      },
    },
    FromTo: {
      props: z.object({
        from: z.string(),
        to: z.string(),
        via: z.string().nullable(),
        icon: z.enum(["arrowRight", "plane", "truck", "send"]).nullable(),
      }),
      description:
        "Large origin -> destination display (warehouse -> customer, old -> new value) with optional via label",
      example: { from: "BKK", to: "CNX", via: "TG 102", icon: "plane" },
    },
    KeyValue: {
      props: z.object({
        pairs: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        ),
        size: z.enum(["sm", "md"]).nullable(),
      }),
      description:
        "Two-column label: value list for details of one record (order, profile, config). Use Table for many records.",
      example: {
        pairs: [
          { label: "Order", value: "#A-1042" },
          { label: "Status", value: "Shipped" },
          { label: "Total", value: "฿283.55" },
        ],
        size: "sm",
      },
    },
  },
  actions: {
    runTool: {
      params: z.object({
        name: z.string(),
        input: z.record(z.string(), z.unknown()).nullable(),
      }),
      description:
        "Call a host or server tool by name. input values may use $bindState from state paths.",
    },
    submitForm: {
      params: z.object({
        statePath: z.string().nullable(),
      }),
      description:
        "Snapshot form state into /lastSubmit (or statePath) after validateForm",
    },
    toast: {
      params: z.object({
        message: z.string(),
      }),
      description: "Set /toast message for a short confirmation callout",
    },
  },
});

export type Catalog = typeof catalog;
