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
        kind: z.enum(["bar", "line"]).nullable(),
        points: z.array(
          z.object({
            label: z.string(),
            value: z.number(),
          }),
        ),
      }),
      description: "Simple bar or line chart for trends and comparisons",
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
            title: "What is Agentic UI?",
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
  },
  actions: {
    submitForm: {
      params: z.object({
        statePath: z.string().nullable(),
      }),
      description:
        "Snapshot form state into /lastSubmit (or statePath) after validateForm",
    },
    loadCities: {
      params: z.object({
        country: z.string(),
      }),
      description:
        "Load city options for a country into /availableCities (watcher demo)",
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
