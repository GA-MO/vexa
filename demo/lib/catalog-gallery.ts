import { nestedToFlat, type Spec } from "@json-render/core";

export type GallerySection = {
  id: string;
  title: string;
  component: string;
  note: string;
  spec: Spec;
};

function specFromTree(tree: Parameters<typeof nestedToFlat>[0]): Spec {
  return nestedToFlat(tree);
}

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
            detail: "Ship AgenticChatOverlay + theme tokens",
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
        code: `import { AgenticChatOverlay } from "agentic-ui/chat";

export function App() {
  return <AgenticChatOverlay api="/api/chat" />;
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
            body: "Set OPENROUTER_API_KEY in demo/.env.local, then restart.",
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
              "Yes for live answers. Set OPENROUTER_API_KEY in demo/.env.local, then restart the demo.",
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
            { type: "IconText", props: { icon: "mail", text: "hello@agentic-ui.dev", hint: null } },
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
            { type: "IconText", props: { icon: "pin", text: "Agentic Café, 2nd floor", hint: "Pickup counter B" } },
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
    prose: "แนะนำ Agentic Café ห่างจาก BTS อโศก 3 นาที มีปลั๊กทุกโต๊ะและ Wi-Fi เร็ว รีวิว 4.6 จาก 1,280 คน",
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
            { type: "Heading", props: { text: "Agentic Café", level: "3" } },
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

export const CATALOG_TYPES = [
  "Stack",
  "Card",
  "Grid",
  "Heading",
  "Text",
  "Metric",
  "Badge",
  "Alert",
  "Separator",
  "Table",
  "List",
  "Button",
  "Chart",
  "Image",
  "Tabs",
  "Progress",
  "Timeline",
  "Input",
  "Form",
  "Avatar",
  "Code",
  "Map",
  "Carousel",
  "Callout",
  "Accordion",
  "Video",
  "Checkbox",
  "Switch",
  "RadioGroup",
  "Select",
  "Rating",
  "Divider",
  "Column",
  "Row",
  "BarChart",
  "LineChart",
  "Icon",
  "IconText",
  "LineItems",
  "FromTo",
  "KeyValue",
] as const;

function interactiveSpec(
  tree: Parameters<typeof nestedToFlat>[0],
  state: Record<string, unknown>,
): Spec {
  return { ...nestedToFlat(tree), state };
}

export type InteractiveSection = {
  id: string;
  title: string;
  note: string;
  spec: Spec;
};

export const INTERACTIVE_SECTIONS: InteractiveSection[] = [
  {
    id: "bind-form",
    title: "Data binding · form",
    note: "$bindState on Input + Button on.press → validateForm + submitForm + toast.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        children: [
          {
            type: "Heading",
            props: { text: "Request access", level: "3" },
          },
          {
            type: "Input",
            props: {
              label: "Email",
              name: "email",
              placeholder: "alex@acme.com",
              inputType: "email",
              value: { $bindState: "/form/email" },
              checks: [
                { type: "required", message: "Email is required", args: null },
                { type: "email", message: "Enter a valid email", args: null },
              ],
              validateOn: "blur",
            },
          },
          {
            type: "Input",
            props: {
              label: "Name",
              name: "name",
              placeholder: "Alex Kim",
              inputType: "text",
              value: { $bindState: "/form/name" },
              checks: [
                { type: "required", message: "Name is required", args: null },
              ],
              validateOn: "blur",
            },
          },
          {
            type: "Text",
            props: {
              content: {
                $template: "Preview: ${/form/name} · ${/form/email}",
              },
              muted: true,
            },
          },
          {
            type: "Button",
            props: { label: "Submit", variant: "primary" },
            on: {
              press: [
                {
                  action: "validateForm",
                  params: { statePath: "/formResult" },
                },
                { action: "submitForm", params: { statePath: "/lastSubmit" } },
                {
                  action: "toast",
                  params: { message: "Submitted — check /lastSubmit in devtools" },
                },
              ],
            },
          },
          {
            type: "Callout",
            props: {
              eyebrow: "Toast",
              title: { $state: "/toast" },
              body: "Action handlers write confirmation text here.",
              tone: "brand",
            },
            visible: { $state: "/toast" },
          },
        ],
      },
      {
        form: { email: "", name: "" },
        toast: "",
        formResult: null,
        lastSubmit: null,
      },
    ),
  },
  {
    id: "bind-choices",
    title: "Bound choices · order builder",
    note: "Select / RadioGroup / Checkbox / Switch bound with $bindState — badges and the address field react via visible, the summary via $template, and the button fires toast.",
    spec: interactiveSpec(
      {
        type: "Card",
        props: {
          title: "Build your latte",
          description: "Every control writes to /order. Nothing below is hard-coded.",
        },
        children: [
          {
            type: "Grid",
            props: { columns: "2", gap: "md" },
            children: [
              {
                type: "Select",
                props: {
                  label: "Size",
                  name: "size",
                  placeholder: "Pick a size",
                  options: [
                    { value: "S", label: "Small · 8 oz" },
                    { value: "M", label: "Medium · 12 oz" },
                    { value: "L", label: "Large · 16 oz" },
                  ],
                  value: { $bindState: "/order/size" },
                  disabled: false,
                },
              },
              {
                type: "RadioGroup",
                props: {
                  label: "Milk",
                  name: "milk",
                  options: [
                    { value: "Whole", label: "Whole" },
                    { value: "Oat", label: "Oat (+฿20)" },
                    { value: "Almond", label: "Almond (+฿20)" },
                  ],
                  value: { $bindState: "/order/milk" },
                  disabled: false,
                },
              },
            ],
          },
          {
            type: "Column",
            props: { gap: "sm", align: "stretch" },
            children: [
              {
                type: "Checkbox",
                props: {
                  label: "Extra shot",
                  name: "extraShot",
                  hint: "+฿25",
                  checked: { $bindState: "/order/extraShot" },
                  disabled: false,
                },
              },
              {
                type: "Checkbox",
                props: {
                  label: "Whipped cream",
                  name: "whip",
                  hint: "+฿15",
                  checked: { $bindState: "/order/whip" },
                  disabled: false,
                },
              },
            ],
          },
          { type: "Divider", props: { label: "Fulfilment" } },
          {
            type: "Switch",
            props: {
              label: "Deliver to me",
              name: "delivery",
              hint: "Off = pick up at the counter",
              checked: { $bindState: "/order/delivery" },
              disabled: false,
            },
          },
          {
            type: "Input",
            props: {
              label: "Delivery address",
              name: "address",
              placeholder: "99 Sukhumvit Rd, Bangkok",
              inputType: "text",
              value: { $bindState: "/order/address" },
              checks: [
                { type: "required", message: "Address is required for delivery", args: null },
              ],
              validateOn: "blur",
            },
            visible: { $state: "/order/delivery" },
          },
          {
            type: "IconText",
            props: {
              icon: "pin",
              text: "Pick up at Agentic Café, 2nd floor",
              hint: "Ready in ~8 minutes",
            },
            visible: { $state: "/order/delivery", not: true },
          },
          { type: "Divider", props: { label: "Summary" } },
          {
            type: "Row",
            props: { gap: "xs", align: "center", justify: "start", wrap: true },
            children: [
              {
                type: "Badge",
                props: { label: { $template: "Size ${/order/size}" }, tone: "neutral" },
              },
              {
                type: "Badge",
                props: { label: { $template: "${/order/milk} milk" }, tone: "neutral" },
              },
              {
                type: "Badge",
                props: { label: "Extra shot", tone: "warning" },
                visible: { $state: "/order/extraShot" },
              },
              {
                type: "Badge",
                props: { label: "Whipped cream", tone: "warning" },
                visible: { $state: "/order/whip" },
              },
              {
                type: "Badge",
                props: { label: "Delivery", tone: "success" },
                visible: { $state: "/order/delivery" },
              },
              {
                type: "Badge",
                props: { label: "Pickup", tone: "success" },
                visible: { $state: "/order/delivery", not: true },
              },
            ],
          },
          {
            type: "Row",
            props: { gap: "sm", align: "center", justify: "end", wrap: true },
            children: [
              {
                type: "Button",
                props: { label: "Reset", variant: "secondary" },
                on: {
                  press: [
                    { action: "setState", params: { statePath: "/order/size", value: "M" } },
                    { action: "setState", params: { statePath: "/order/milk", value: "Whole" } },
                    { action: "setState", params: { statePath: "/order/extraShot", value: false } },
                    { action: "setState", params: { statePath: "/order/whip", value: false } },
                    { action: "setState", params: { statePath: "/order/delivery", value: false } },
                    { action: "setState", params: { statePath: "/toast", value: "" } },
                  ],
                },
              },
              {
                type: "Button",
                props: { label: "Place order", variant: "primary" },
                on: {
                  press: [
                    { action: "validateForm", params: { statePath: "/orderResult" } },
                    {
                      action: "toast",
                      params: {
                        message: "Order placed — inspect /order in devtools to see the bound state",
                      },
                    },
                  ],
                },
              },
            ],
          },
          {
            type: "Callout",
            props: {
              eyebrow: "Toast",
              title: { $state: "/toast" },
              body: { $template: "Size ${/order/size} · ${/order/milk} milk" },
              tone: "brand",
            },
            visible: { $state: "/toast" },
          },
        ],
      },
      {
        order: {
          size: "M",
          milk: "Whole",
          extraShot: false,
          whip: false,
          delivery: false,
          address: "",
        },
        toast: "",
        orderResult: null,
      },
    ),
  },
  {
    id: "visibility",
    title: "Visibility",
    note: "Toggle /showDetails with setState; Alert uses visible.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        children: [
          {
            type: "Stack",
            props: { direction: "horizontal", gap: "sm" },
            children: [
              {
                type: "Button",
                props: { label: "Show details", variant: "primary" },
                on: {
                  press: {
                    action: "setState",
                    params: { statePath: "/showDetails", value: true },
                  },
                },
              },
              {
                type: "Button",
                props: { label: "Hide", variant: "secondary" },
                on: {
                  press: {
                    action: "setState",
                    params: { statePath: "/showDetails", value: false },
                  },
                },
              },
            ],
          },
          {
            type: "Alert",
            props: {
              title: "Details visible",
              body: "This Alert only renders when /showDetails is true.",
              tone: "info",
            },
            visible: { $state: "/showDetails" },
          },
          {
            type: "Text",
            props: {
              content: "Details are hidden. Press Show details.",
              muted: true,
            },
            visible: { $state: "/showDetails", not: true },
          },
        ],
      },
      { showDetails: false },
    ),
  },
  {
    id: "repeat",
    title: "Repeat · $item",
    note: "Column repeats over /todos; each row reads $item fields and $cond picks the badge.",
    spec: {
      root: "list",
      state: {
        todos: [
          { id: "1", title: "Ship overlay", done: true },
          { id: "2", title: "Wire binding", done: false },
          { id: "3", title: "Add watchers", done: false },
        ],
      },
      elements: {
        list: {
          type: "Stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["heading", "items"],
        },
        heading: {
          type: "Heading",
          props: { text: "Sprint todos", level: "3" },
          children: [],
        },
        items: {
          type: "Column",
          props: { gap: "xs", align: "stretch" },
          repeat: { statePath: "/todos", key: "id" },
          children: ["item-row"],
        },
        "item-row": {
          type: "Row",
          props: { gap: "sm", align: "center", justify: "between", wrap: false },
          children: ["item-label", "item-badge"],
        },
        "item-label": {
          type: "IconText",
          props: {
            icon: {
              $cond: { $item: "done" },
              $then: "check",
              $else: "clock",
            },
            text: { $item: "title" },
            hint: null,
          },
          children: [],
        },
        "item-badge": {
          type: "Badge",
          props: {
            label: {
              $cond: { $item: "done" },
              $then: "Done",
              $else: "Pending",
            },
            tone: {
              $cond: { $item: "done" },
              $then: "success",
              $else: "neutral",
            },
          },
          children: [],
        },
      },
    },
  },
  {
    id: "watcher",
    title: "Watchers",
    note: "Changing country watches /form/country → loadCities fills /availableCities.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        watch: {
          "/form/country": {
            action: "loadCities",
            params: { country: { $state: "/form/country" } },
          },
        },
        children: [
          {
            type: "Input",
            props: {
              label: "Country code",
              name: "country",
              placeholder: "TH, US, or JP",
              inputType: "text",
              value: { $bindState: "/form/country" },
              checks: null,
              validateOn: "change",
            },
          },
          {
            type: "Text",
            props: {
              content: {
                $template: "Cities: ${/availableCities}",
              },
              muted: false,
            },
          },
          {
            type: "Callout",
            props: {
              eyebrow: "Hint",
              title: "Try TH / US / JP",
              body: "Watcher fires when the bound country path changes.",
              tone: "info",
            },
          },
        ],
      },
      {
        form: { country: "TH", city: "" },
        availableCities: ["Bangkok", "Chiang Mai", "Phuket"],
      },
    ),
  },
  {
    id: "computed",
    title: "Computed · directives",
    note: "$computed fullName / formatCurrency and $format / $template.",
    spec: interactiveSpec(
      {
        type: "Stack",
        props: { direction: "vertical", gap: "md" },
        children: [
          {
            type: "Input",
            props: {
              label: "First name",
              name: "first",
              placeholder: "Alex",
              inputType: "text",
              value: { $bindState: "/user/first" },
              checks: null,
              validateOn: null,
            },
          },
          {
            type: "Input",
            props: {
              label: "Last name",
              name: "last",
              placeholder: "Kim",
              inputType: "text",
              value: { $bindState: "/user/last" },
              checks: null,
              validateOn: null,
            },
          },
          {
            type: "Metric",
            props: {
              label: {
                $computed: "fullName",
                args: {
                  first: { $state: "/user/first" },
                  last: { $state: "/user/last" },
                },
              },
              value: {
                $computed: "formatCurrency",
                args: {
                  value: { $state: "/invoice/total" },
                  currency: "THB",
                },
              },
              detail: {
                $template: "Invoice for ${/user/first}",
              },
              trend: "up",
            },
          },
          {
            type: "Text",
            props: {
              content: {
                $format: "currency",
                value: { $state: "/invoice/total" },
                currency: "THB",
              },
              muted: true,
            },
          },
        ],
      },
      {
        user: { first: "Alex", last: "Kim" },
        invoice: { total: 2490 },
      },
    ),
  },
];

