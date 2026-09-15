import type { Spec } from "@json-render/core";
import { specFromTree } from "./tree";

export type GallerySection = {
  id: string;
  title: string;
  component: string;
  note: string;
  spec: Spec;
};

export const GALLERY_SECTIONS: GallerySection[] = [
  {
    id: "heading-text",
    title: "Heading + Text",
    component: "Heading, Text",
    note: "Titles and body copy inside generated UI.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Heading",
          props: { text: "Quarterly revenue", level: "1" },
        },
        {
          type: "Heading",
          props: { text: "Section title", level: "2" },
        },
        {
          type: "Heading",
          props: { text: "Subsection", level: "3" },
        },
        {
          type: "Text",
          props: {
            content:
              "Body copy for explanations, summaries, and supporting detail under a heading.",
            muted: false,
          },
        },
        {
          type: "Text",
          props: {
            content: "Muted helper text for secondary context.",
            muted: true,
          },
        },
      ],
    }),
  },
  {
    id: "badge",
    title: "Badge",
    component: "Badge",
    note: "Status pills — all tones.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "horizontal", gap: "sm" },
      children: [
        { type: "Badge", props: { label: "Neutral", tone: "neutral" } },
        { type: "Badge", props: { label: "Success", tone: "success" } },
        { type: "Badge", props: { label: "Warning", tone: "warning" } },
        { type: "Badge", props: { label: "Danger", tone: "danger" } },
      ],
    }),
  },
  {
    id: "alert",
    title: "Alert",
    component: "Alert",
    note: "Callouts for tips and risks — all tones.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      children: [
        {
          type: "Alert",
          props: {
            title: "Info",
            body: "Ask for a dashboard when you want visual cards.",
            tone: "info",
          },
        },
        {
          type: "Alert",
          props: {
            title: "Success",
            body: "Spec validated against the catalog.",
            tone: "success",
          },
        },
        {
          type: "Alert",
          props: {
            title: "Warning",
            body: "Never nest Card inside Card.",
            tone: "warning",
          },
        },
        {
          type: "Alert",
          props: {
            title: "Danger",
            body: "Missing required table columns will fail validation.",
            tone: "danger",
          },
        },
      ],
    }),
  },
  {
    id: "metric",
    title: "Metric",
    component: "Metric",
    note: "KPI tiles with up / down / neutral trends.",
    spec: specFromTree({
      type: "Grid",
      props: { columns: "3", gap: "md" },
      children: [
        {
          type: "Metric",
          props: {
            label: "Revenue",
            value: "฿2.4M",
            detail: "+12% QoQ",
            trend: "up",
          },
        },
        {
          type: "Metric",
          props: {
            label: "Churn",
            value: "2.1%",
            detail: "-0.4% QoQ",
            trend: "down",
          },
        },
        {
          type: "Metric",
          props: {
            label: "NPS",
            value: "48",
            detail: "Flat vs last quarter",
            trend: "neutral",
          },
        },
      ],
    }),
  },
  {
    id: "card-grid",
    title: "Card + Grid + Stack",
    component: "Card, Grid, Stack",
    note: "Layout primitives for dashboards.",
    spec: specFromTree({
      type: "Card",
      props: {
        title: "Ops snapshot",
        description: "Card wraps related metrics without nesting another Card.",
      },
      children: [
        {
          type: "Grid",
          props: { columns: "2", gap: "md" },
          children: [
            {
              type: "Metric",
              props: {
                label: "Open tickets",
                value: "128",
                detail: "+6 today",
                trend: "up",
              },
            },
            {
              type: "Metric",
              props: {
                label: "SLA met",
                value: "97%",
                detail: "Within target",
                trend: "neutral",
              },
            },
          ],
        },
      ],
    }),
  },
  {
    id: "list",
    title: "List",
    component: "List",
    note: "Bullet and ordered steps.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Heading",
          props: { text: "Checklist", level: "3" },
        },
        {
          type: "List",
          props: {
            items: ["Collect requirements", "Draft catalog UI", "Ship overlay"],
            ordered: false,
          },
        },
        {
          type: "Heading",
          props: { text: "Onboarding", level: "3" },
        },
        {
          type: "List",
          props: {
            items: [
              "Create account",
              "Connect OpenRouter",
              "Ask for a dashboard",
            ],
            ordered: true,
          },
        },
      ],
    }),
  },
  {
    id: "table",
    title: "Table",
    component: "Table",
    note: "Comparison / tabular answers.",
    spec: specFromTree({
      type: "Table",
      props: {
        columns: [
          { key: "plan", label: "Plan" },
          { key: "price", label: "Price" },
          { key: "seats", label: "Seats" },
          { key: "support", label: "Support" },
        ],
        rows: [
          {
            plan: "Free",
            price: "฿0",
            seats: "1",
            support: "Community",
          },
          {
            plan: "Pro",
            price: "฿990",
            seats: "10",
            support: "Email",
          },
          {
            plan: "Enterprise",
            price: "Custom",
            seats: "Unlimited",
            support: "Dedicated",
          },
        ],
      },
    }),
  },
  {
    id: "separator-button",
    title: "Separator + Button",
    component: "Separator, Button",
    note: "Divider and primary / secondary actions.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Text",
          props: {
            content:
              "Use Separator between content blocks, then CTA buttons.",
            muted: false,
          },
        },
        { type: "Separator", props: {} },
        {
          type: "Stack",
          props: { direction: "horizontal", gap: "sm" },
          children: [
            {
              type: "Button",
              props: { label: "Continue", variant: "primary" },
            },
            {
              type: "Button",
              props: { label: "Cancel", variant: "secondary" },
            },
          ],
        },
      ],
    }),
  },
  {
    id: "chart",
    title: "Chart",
    component: "Chart",
    note: "Bar and line charts for trends.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Chart",
          props: {
            title: "Quarterly revenue (bar)",
            kind: "bar",
            points: [
              { label: "Q1", value: 12 },
              { label: "Q2", value: 18 },
              { label: "Q3", value: 15 },
              { label: "Q4", value: 22 },
            ],
          },
        },
        {
          type: "Chart",
          props: {
            title: "Active users (line)",
            kind: "line",
            points: [
              { label: "Mon", value: 40 },
              { label: "Tue", value: 55 },
              { label: "Wed", value: 48 },
              { label: "Thu", value: 70 },
              { label: "Fri", value: 62 },
            ],
          },
        },
        {
          type: "Chart",
          props: {
            title: "Revenue by channel (pie)",
            kind: "pie",
            points: [
              { label: "Direct", value: 42 },
              { label: "Partners", value: 28 },
              { label: "Marketplace", value: 18 },
              { label: "Other", value: 12 },
            ],
          },
        },
        {
          type: "Chart",
          props: {
            title: "Daily signups (spark)",
            kind: "spark",
            points: [
              { label: "1", value: 12 },
              { label: "2", value: 18 },
              { label: "3", value: 15 },
              { label: "4", value: 22 },
              { label: "5", value: 19 },
              { label: "6", value: 27 },
              { label: "7", value: 31 },
            ],
          },
        },
      ],
    }),
  },
  {
    id: "image",
    title: "Image",
    component: "Image",
    note: "Product or context visuals with caption.",
    spec: specFromTree({
      type: "Image",
      props: {
        src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
        alt: "Analytics dashboard on a laptop",
        caption: "Sample product visual for generative answers",
        aspect: "wide",
      },
    }),
  },
  {
    id: "tabs",
    title: "Tabs",
    component: "Tabs",
    note: "Switch related text views without nesting cards.",
    spec: specFromTree({
      type: "Tabs",
      props: {
        items: [
          {
            label: "Overview",
            content: "High-level summary of the initiative and goals.",
          },
          {
            label: "Risks",
            content: "Watch scope creep and OpenRouter rate limits.",
          },
          {
            label: "Next",
            content: "Ship Chart + Timeline in the next catalog pass.",
          },
        ],
      },
    }),
  },
  {
    id: "progress",
    title: "Progress",
    component: "Progress",
    note: "Completion bars for onboarding and pipelines.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      children: [
        {
          type: "Progress",
          props: {
            label: "Onboarding",
            value: 65,
            detail: "3 of 5 steps complete",
          },
        },
        {
          type: "Progress",
          props: {
            label: "Migration",
            value: 28,
            detail: "Schema done, UI pending",
          },
        },
      ],
    }),
  },
  {
    id: "timeline",
    title: "Timeline",
    component: "Timeline",
    note: "Roadmaps, incidents, and journeys.",
    spec: specFromTree({
      type: "Timeline",
      props: {
        items: [
          {
            title: "Discovery",
            detail: "Interview stakeholders and map flows",
            time: "Week 1",
          },
          {
            title: "Build overlay",
            detail: "Ship VexaChatOverlay + theme tokens",
            time: "Week 2",
          },
          {
            title: "Expand catalog",
            detail: "Add Chart, Tabs, Form, and Timeline",
            time: "Week 3",
          },
        ],
      },
    }),
  },
  {
    id: "input-form",
    title: "Input + Form",
    component: "Input, Form",
    note: "Collect follow-up values before an action.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Input",
          props: {
            label: "Workspace name",
            name: "workspace",
            placeholder: "acme-ops",
            inputType: "text",
          },
        },
        {
          type: "Form",
          props: {
            title: "Request access",
            submitLabel: "Send request",
            fields: [
              {
                label: "Name",
                name: "name",
                placeholder: "Alex Kim",
                inputType: "text",
              },
              {
                label: "Email",
                name: "email",
                placeholder: "alex@acme.com",
                inputType: "email",
              },
              {
                label: "Seats",
                name: "seats",
                placeholder: "10",
                inputType: "number",
              },
              {
                label: "Notes",
                name: "notes",
                placeholder: "Anything we should know?",
                inputType: "textarea",
              },
            ],
          },
        },
      ],
    }),
  },
  {
    id: "avatar",
    title: "Avatar",
    component: "Avatar",
    note: "People, assignees, and owners.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Avatar",
          props: {
            name: "Alex Kim",
            role: "Owner",
            src: null,
            size: "md",
          },
        },
        {
          type: "Avatar",
          props: {
            name: "Sam Rivera",
            role: "Designer",
            src: null,
            size: "lg",
          },
        },
      ],
    }),
  },
  {
    id: "code",
    title: "Code",
    component: "Code",
    note: "Snippets and config blocks inside generative UI.",
    spec: specFromTree({
      type: "Code",
      props: {
        filename: "overlay.tsx",
        language: "tsx",
        code: `import { VexaChatOverlay } from "vexa/chat";

export function App() {
  return <VexaChatOverlay api="/api/chat" />;
}`,
      },
    }),
  },
  {
    id: "map",
    title: "Map",
    component: "Map",
    note: "Location answers with center pin and marker list.",
    spec: specFromTree({
      type: "Map",
      props: {
        title: "Bangkok offices",
        latitude: 13.7563,
        longitude: 100.5018,
        zoom: 12,
        markers: [
          {
            label: "HQ · Silom",
            latitude: 13.7262,
            longitude: 100.5381,
          },
          {
            label: "Support · Asok",
            latitude: 13.7373,
            longitude: 100.5605,
          },
        ],
      },
    }),
  },
  {
    id: "carousel",
    title: "Carousel · images",
    component: "Carousel",
    note: "Free-scroll swipe gallery (drag / flick).",
    spec: specFromTree({
      type: "Carousel",
      props: {
        variant: "image",
        items: [
          {
            src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
            alt: "Analytics dashboard",
            caption: "Ops overview",
            title: null,
            description: null,
            badge: null,
          },
          {
            src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
            alt: "Laptop with charts",
            caption: "Weekly report",
            title: null,
            description: null,
            badge: null,
          },
          {
            src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
            alt: "Team collaboration",
            caption: "Kickoff workshop",
            title: null,
            description: null,
            badge: null,
          },
        ],
      },
    }),
  },
  {
    id: "carousel-cards",
    title: "Carousel · cards",
    component: "Carousel",
    note: "Plan / feature cards in a free-scroll strip.",
    spec: specFromTree({
      type: "Carousel",
      props: {
        variant: "card",
        items: [
          {
            src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
            alt: "Free plan visual",
            caption: "Start free",
            title: "Free",
            description: "1 workspace, community support, core chat.",
            badge: null,
          },
          {
            src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
            alt: "Pro plan visual",
            caption: "Most teams",
            title: "Pro",
            description: "Generative UI, 10 seats, email support.",
            badge: "Popular",
          },
          {
            src: null,
            alt: null,
            caption: "Talk to sales",
            title: "Enterprise",
            description: "SSO, SLA, dedicated success, custom catalog.",
            badge: "Custom",
          },
          {
            src: null,
            alt: null,
            caption: "Add-on",
            title: "MCP Apps",
            description: "Ship interactive tools inside MCP hosts.",
            badge: "New",
          },
        ],
      },
    }),
  },
  {
    id: "callout",
    title: "Callout",
    component: "Callout",
    note: "Key takeaways that should stand out more than Alert.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      children: [
        {
          type: "Callout",
          props: {
            eyebrow: "Tip",
            title: "Swipe the plan cards",
            body: "Carousel variant='card' supports free drag-scroll across plans.",
            tone: "brand",
          },
        },
        {
          type: "Callout",
          props: {
            eyebrow: "Note",
            title: "OpenRouter required for live chat",
            body: "Set OPENROUTER_API_KEY in examples/shop-admin/.env.local, then restart.",
            tone: "info",
          },
        },
        {
          type: "Callout",
          props: {
            eyebrow: "Warning",
            title: "Never nest Card in Card",
            body: "Use Stack or Grid inside a Card instead.",
            tone: "warning",
          },
        },
      ],
    }),
  },
  {
    id: "accordion",
    title: "Accordion",
    component: "Accordion",
    note: "Dense FAQ / policy content without long pages.",
    spec: specFromTree({
      type: "Accordion",
      props: {
        items: [
          {
            title: "What can the chat emit?",
            content:
              "Text plus constrained generative UI from the catalog — metrics, charts, forms, maps, and more.",
          },
          {
            title: "Do I need OpenRouter?",
            content:
              "Yes for live answers. Set OPENROUTER_API_KEY in examples/shop-admin/.env.local, then restart the demo.",
          },
          {
            title: "Can I nest Card inside Card?",
            content:
              "No. Use Stack or Grid inside a Card instead to keep layout valid and readable.",
          },
        ],
      },
    }),
  },
  {
    id: "video",
    title: "Video",
    component: "Video",
    note: "Embedded demos and walkthrough clips.",
    spec: specFromTree({
      type: "Video",
      props: {
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster: null,
        caption: "Sample product walkthrough clip",
        aspect: "wide",
      },
    }),
  },
  {
    id: "checkbox-switch",
    title: "Checkbox + Switch",
    component: "Checkbox, Switch",
    note: "Boolean inputs — single agreement vs on/off settings.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Checkbox",
          props: {
            label: "I agree to the terms of service",
            name: "agree",
            hint: "Required before you can continue",
            checked: true,
            disabled: false,
          },
        },
        {
          type: "Checkbox",
          props: {
            label: "Subscribe to product updates",
            name: "subscribe",
            hint: null,
            checked: false,
            disabled: false,
          },
        },
        { type: "Separator", props: {} },
        {
          type: "Switch",
          props: {
            label: "Email notifications",
            name: "notify",
            hint: "Send a digest every morning at 9:00",
            checked: true,
            disabled: false,
          },
        },
        {
          type: "Switch",
          props: {
            label: "Two-factor authentication",
            name: "twoFactor",
            hint: "Managed by your workspace admin",
            checked: false,
            disabled: true,
          },
        },
      ],
    }),
  },
  {
    id: "radio-group",
    title: "RadioGroup",
    component: "RadioGroup",
    note: "Exactly one of 2–6 exclusive choices.",
    spec: specFromTree({
      type: "RadioGroup",
      props: {
        label: "Billing plan",
        name: "plan",
        options: [
          { value: "free", label: "Free — 1 workspace" },
          { value: "pro", label: "Pro — ฿990 / month" },
          { value: "enterprise", label: "Enterprise — custom" },
        ],
        value: "pro",
        disabled: false,
      },
    }),
  },
  {
    id: "select",
    title: "Select",
    component: "Select",
    note: "Dropdown for longer option lists.",
    spec: specFromTree({
      type: "Grid",
      props: { columns: "2", gap: "md" },
      children: [
        {
          type: "Select",
          props: {
            label: "Country",
            name: "country",
            placeholder: "Choose a country",
            options: [
              { value: "th", label: "Thailand" },
              { value: "sg", label: "Singapore" },
              { value: "jp", label: "Japan" },
              { value: "vn", label: "Vietnam" },
            ],
            value: "th",
            disabled: false,
          },
        },
        {
          type: "Select",
          props: {
            label: "Timezone",
            name: "timezone",
            placeholder: "Select timezone",
            options: [
              { value: "Asia/Bangkok", label: "Asia/Bangkok (UTC+7)" },
              { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8)" },
              { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
            ],
            value: null,
            disabled: false,
          },
        },
      ],
    }),
  },
  {
    id: "rating",
    title: "Rating",
    component: "Rating",
    note: "Read-only star score with half stars and review count.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      children: [
        {
          type: "Rating",
          props: {
            label: "Customer rating",
            value: 4.5,
            max: 5,
            count: 1280,
            showValue: true,
          },
        },
        {
          type: "Rating",
          props: {
            label: "Support",
            value: 3.2,
            max: 5,
            count: null,
            showValue: true,
          },
        },
        {
          type: "Rating",
          props: {
            label: null,
            value: 5,
            max: 5,
            count: 12,
            showValue: false,
          },
        },
      ],
    }),
  },
  {
    id: "divider",
    title: "Divider",
    component: "Divider",
    note: "Plain rule or labeled rule between groups.",
    spec: specFromTree({
      type: "Column",
      props: { gap: "sm", align: "stretch" },
      children: [
        { type: "Text", props: { content: "Orders placed this morning.", muted: false } },
        { type: "Divider", props: { label: null } },
        { type: "Text", props: { content: "Orders placed this afternoon.", muted: false } },
        { type: "Divider", props: { label: "Yesterday" } },
        { type: "Text", props: { content: "Older orders are archived.", muted: true } },
      ],
    }),
  },
  {
    id: "column-row",
    title: "Column + Row",
    component: "Column, Row",
    note: "gap · align · justify · wrap — dense layout inside a card.",
    spec: specFromTree({
      type: "Card",
      props: { title: "Order #A-1042", description: null },
      children: [
        {
          type: "Column",
          props: { gap: "sm", align: "stretch" },
          children: [
            {
              type: "Row",
              props: { gap: "sm", align: "center", justify: "between", wrap: true },
              children: [
                {
                  type: "Row",
                  props: { gap: "xs", align: "center", justify: "start", wrap: false },
                  children: [
                    { type: "Icon", props: { name: "truck", tone: "primary", size: "sm" } },
                    { type: "Text", props: { content: "Out for delivery", muted: false } },
                  ],
                },
                { type: "Badge", props: { label: "ETA 15:30", tone: "success" } },
              ],
            },
            {
              type: "Row",
              props: { gap: "sm", align: "center", justify: "between", wrap: true },
              children: [
                { type: "Text", props: { content: "Courier", muted: true } },
                { type: "Text", props: { content: "Kerry Express", muted: false } },
              ],
            },
            {
              type: "Row",
              props: { gap: "sm", align: "center", justify: "between", wrap: true },
              children: [
                { type: "Text", props: { content: "Tracking", muted: true } },
                { type: "Text", props: { content: "KEX-77193-TH", muted: false } },
              ],
            },
            { type: "Divider", props: { label: null } },
            {
              type: "Row",
              props: { gap: "sm", align: "center", justify: "end", wrap: true },
              children: [
                { type: "Button", props: { label: "Track", variant: "secondary" } },
                { type: "Button", props: { label: "Contact courier", variant: "primary" } },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    id: "bar-chart",
    title: "BarChart",
    component: "BarChart",
    note: "Horizontal (recommended in chat) · vertical · multi-series · stacked.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "BarChart",
          props: {
            title: "Sales by region (horizontal, 2 series)",
            labels: ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen", "Hat Yai"],
            series: [
              { name: "2025", values: [120000, 80000, 64000, 42000, 38000] },
              { name: "2026", values: [150000, 92000, 71000, 51000, 40000] },
            ],
            horizontal: true,
            stacked: false,
            showValues: false,
            format: "currency",
            height: "md",
          },
        },
        {
          type: "BarChart",
          props: {
            title: "Tickets by priority (horizontal, values)",
            labels: ["Critical", "High", "Medium", "Low"],
            series: [{ name: "Open", values: [4, 17, 32, 21] }],
            horizontal: true,
            stacked: false,
            showValues: true,
            format: "number",
            height: "md",
          },
        },
        {
          type: "BarChart",
          props: {
            title: "Monthly revenue (vertical, stacked)",
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            series: [
              { name: "Subscriptions", values: [42, 48, 51, 55, 60, 66] },
              { name: "Services", values: [18, 15, 22, 19, 24, 21] },
              { name: "Hardware", values: [6, 9, 7, 11, 8, 12] },
            ],
            horizontal: false,
            stacked: true,
            showValues: false,
            format: "number",
            height: "md",
          },
        },
      ],
    }),
  },
  {
    id: "line-chart",
    title: "LineChart",
    component: "LineChart",
    note: "Single area series and a 30-point multi-series trend with thinned labels.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "LineChart",
          props: {
            title: "Weekly active users (area)",
            labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
            series: [{ name: "Users", values: [420, 480, 465, 530, 590, 575, 640, 700] }],
            area: true,
            showDots: true,
            format: "number",
            height: "md",
          },
        },
        {
          type: "LineChart",
          props: {
            title: "Daily conversion rate (30 days, 2 series)",
            labels: Array.from({ length: 30 }, (_, i) => `${i + 1} Aug`),
            series: [
              {
                name: "Web",
                values: Array.from({ length: 30 }, (_, i) =>
                  Math.round((2.4 + Math.sin(i / 4) * 0.6 + i * 0.03) * 100) / 100,
                ),
              },
              {
                name: "App",
                values: Array.from({ length: 30 }, (_, i) =>
                  Math.round((3.1 + Math.cos(i / 5) * 0.5 + i * 0.02) * 100) / 100,
                ),
              },
            ],
            area: false,
            showDots: false,
            format: "percent",
            height: "md",
          },
        },
      ],
    }),
  },
  {
    id: "icon-icontext",
    title: "Icon + IconText",
    component: "Icon, IconText",
    note: "Named icon set with tones, and icon-led contact rows.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "md" },
      children: [
        {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "start", wrap: true },
          children: [
            { type: "Icon", props: { name: "phone", tone: "default", size: "md" } },
            { type: "Icon", props: { name: "mail", tone: "muted", size: "md" } },
            { type: "Icon", props: { name: "pin", tone: "primary", size: "md" } },
            { type: "Icon", props: { name: "check", tone: "success", size: "md" } },
            { type: "Icon", props: { name: "alert", tone: "warning", size: "md" } },
            { type: "Icon", props: { name: "trash", tone: "danger", size: "md" } },
            { type: "Icon", props: { name: "truck", tone: "primary", size: "lg" } },
            { type: "Icon", props: { name: "receipt", tone: "default", size: "lg" } },
            { type: "Icon", props: { name: "heart", tone: "danger", size: "sm" } },
          ],
        },
        {
          type: "Column",
          props: { gap: "sm", align: "stretch" },
          children: [
            { type: "IconText", props: { icon: "phone", text: "02-123-4567", hint: "Mon–Fri 9:00–18:00" } },
            { type: "IconText", props: { icon: "mail", text: "hello@vexa.dev", hint: null } },
            { type: "IconText", props: { icon: "pin", text: "99 Sukhumvit Rd, Bangkok 10110", hint: "Near BTS Asok" } },
            { type: "IconText", props: { icon: "clock", text: "Open until 21:00", hint: null } },
          ],
        },
      ],
    }),
  },
  {
    id: "line-items",
    title: "LineItems",
    component: "LineItems",
    note: "Receipt lines with qty, detail, and summary totals.",
    spec: specFromTree({
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
    }),
  },
  {
    id: "from-to",
    title: "FromTo",
    component: "FromTo",
    note: "Origin → destination, with optional via label and icon.",
    spec: specFromTree({
      type: "Stack",
      props: { direction: "vertical", gap: "sm" },
      children: [
        { type: "FromTo", props: { from: "BKK", to: "CNX", via: "TG 102 · 1h 15m", icon: "plane" } },
        { type: "FromTo", props: { from: "Warehouse A", to: "Customer", via: "Kerry", icon: "truck" } },
        { type: "FromTo", props: { from: "Free plan", to: "Pro plan", via: null, icon: "arrowRight" } },
      ],
    }),
  },
  {
    id: "key-value",
    title: "KeyValue",
    component: "KeyValue",
    note: "Label : value pairs for a single record.",
    spec: specFromTree({
      type: "KeyValue",
      props: {
        pairs: [
          { label: "Order", value: "#A-1042" },
          { label: "Customer", value: "Alex Kim" },
          { label: "Status", value: "Shipped" },
          { label: "Payment", value: "PromptPay" },
          { label: "Total", value: "฿315.65" },
        ],
        size: "sm",
      },
    }),
  },
];
