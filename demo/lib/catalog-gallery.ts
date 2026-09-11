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
];

export const COMPOSED_DASHBOARD_SPEC: Spec = specFromTree({
  type: "Stack",
  props: { direction: "vertical", gap: "lg" },
  children: [
    {
      type: "Stack",
      props: { direction: "horizontal", gap: "sm" },
      children: [
        {
          type: "Heading",
          props: { text: "Sales dashboard", level: "1" },
        },
        { type: "Badge", props: { label: "Live", tone: "success" } },
      ],
    },
    {
      type: "Text",
      props: {
        content:
          "สรุปยอดขายรายไตรมาส พร้อม metric, chart และตารางเปรียบเทียบแผน",
        muted: false,
      },
    },
    {
      type: "Grid",
      props: { columns: "3", gap: "md" },
      children: [
        {
          type: "Metric",
          props: {
            label: "Q1",
            value: "฿1.2M",
            detail: "+8%",
            trend: "up",
          },
        },
        {
          type: "Metric",
          props: {
            label: "Q2",
            value: "฿1.5M",
            detail: "+11%",
            trend: "up",
          },
        },
        {
          type: "Metric",
          props: {
            label: "Q3",
            value: "฿1.1M",
            detail: "-4%",
            trend: "down",
          },
        },
      ],
    },
    {
      type: "Chart",
      props: {
        title: "Revenue trend",
        kind: "line",
        points: [
          { label: "Q1", value: 12 },
          { label: "Q2", value: 15 },
          { label: "Q3", value: 11 },
          { label: "Q4", value: 18 },
        ],
      },
    },
    {
      type: "Card",
      props: {
        title: "Plan comparison",
        description: "Typical Free / Pro / Enterprise table answer",
      },
      children: [
        {
          type: "Table",
          props: {
            columns: [
              { key: "plan", label: "Plan" },
              { key: "price", label: "Price" },
              { key: "feature", label: "Highlight" },
            ],
            rows: [
              { plan: "Free", price: "฿0", feature: "1 workspace" },
              { plan: "Pro", price: "฿990", feature: "Generative UI" },
              {
                plan: "Enterprise",
                price: "Custom",
                feature: "SSO + SLA",
              },
            ],
          },
        },
      ],
    },
    {
      type: "Tabs",
      props: {
        items: [
          {
            label: "Timeline",
            content: "Discovery → Build overlay → Expand catalog.",
          },
          {
            label: "Owner",
            content: "Alex Kim owns rollout; Sam handles visual QA.",
          },
        ],
      },
    },
    {
      type: "Progress",
      props: {
        label: "Catalog coverage",
        value: 100,
        detail: "All planned types shipped in this pass",
      },
    },
    {
      type: "Alert",
      props: {
        title: "Ready",
        body: "Open /catalog to review every type, then ask the chat for a dashboard.",
        tone: "success",
      },
    },
    {
      type: "Stack",
      props: { direction: "horizontal", gap: "sm" },
      children: [
        {
          type: "Button",
          props: { label: "Export summary", variant: "primary" },
        },
        {
          type: "Button",
          props: { label: "Share", variant: "secondary" },
        },
      ],
    },
  ],
});

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
    note: "Stack repeats over /todos; each child reads $item fields.",
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
          type: "Stack",
          props: { direction: "vertical", gap: "sm" },
          repeat: { statePath: "/todos", key: "id" },
          children: ["item-card"],
        },
        "item-card": {
          type: "Card",
          props: {
            title: { $item: "title" },
            description: {
              $cond: { $item: "done" },
              $then: "Done",
              $else: "Pending",
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

