import { PROMPTS } from "./mock-script";
import type { VexaTheme } from "vexa/react";
import type { ChatComposerOptions } from "vexa/chat";
import type { LanguagePreset, Position } from "./presets";

export type GuideId = "theme" | "labels" | "composer" | "position" | "placement";

export type Guide = {
  id: GuideId;
  title: string;
  what: string[];
  docs: string;
  prompts: string[];
  link?: { label: string; href: string };
};

export const GUIDES: Guide[] = [
  {
    id: "theme",
    title: "Match the widget to your brand",
    what: [
      "`VexaProvider theme` sets the tokens every catalog component and the chat chrome read: `primary` and `primaryDark` for the accent, `secondary` for the gradient end, `radius` for corners, `mode` for light, dark or system, `glow: false` to drop the tinted shadows around the panel and launcher.",
      "Nothing else changes: the reply below is the same spec under every preset, only the tokens differ.",
    ],
    docs: "host/theme",
    prompts: [PROMPTS.usage],
  },
  {
    id: "labels",
    title: "Translate the chat chrome",
    what: [
      "`chat.labels` replaces every built-in string (empty state, thinking, approvals, start over, launcher) and `format` sets the locale and currency that Metric, LineItems and charts use.",
      "The model answers in whatever language the user writes; the labels are what the host owns.",
    ],
    docs: "host/labels-and-i18n",
    prompts: [PROMPTS.usageThai],
  },
  {
    id: "composer",
    title: "Trim the composer",
    what: [
      "`chat.composer` switches off the controls a small widget does not need: `attachments: false` removes the attach menu and ignores dropped or pasted files, `tokenUsage: false` removes the context meter next to the send button, `modelPicker: false` removes the model button. Every control is on by default except the model picker, which shows itself only when the server publishes more than one model; this page has one, so it is hidden until you force it.",
      "The textarea and the send button always stay. The same object works as the `composer` prop on `VexaChat` or `VexaChatOverlay` for one instance.",
    ],
    docs: "host/provider",
    prompts: [PROMPTS.help],
  },
  {
    id: "position",
    title: "Place the launcher",
    what: [
      "`chat.position` puts the launcher and panel bottom-right or bottom-left; `chat.launcherLabel` is its accessible name and tooltip; `backdrop: false` keeps the page usable while the chat is open.",
      "The same fields work as props on `VexaChatOverlay` when one page needs something different.",
    ],
    docs: "host/provider",
    prompts: [PROMPTS.help],
  },
  {
    id: "placement",
    title: "Overlay, framed panel, flush inline, or full page",
    what: [
      "`VexaChatOverlay` is the floating launcher plus panel. The same chat also renders in your layout: `<VexaChat />` fills whatever box you give it as a framed card, `<VexaChat layout=\"inline\" />` fills it flush with no radius, border, or shadow so your sidebar or drawer draws the edges, and `<VexaChat layout=\"page\" />` takes the whole viewport for a dedicated route.",
      "All of them read the provider's `chat` defaults, so switching placement changes one line; the prompt below goes to whichever chat is mounted. In `page` layout the header, messages and composer sit in a centered column (`max-w-3xl`) so wide screens stay readable.",
    ],
    docs: "host/provider",
    prompts: [PROMPTS.usage],
    link: { label: "Open the full-page layout", href: "#fullpage" },
  },
];

export type Placement = "overlay" | "panel" | "inline";

export const PLACEMENTS: Placement[] = ["overlay", "panel", "inline"];

const PAGE_HINT = "\n\n// a dedicated route instead (open #fullpage to see it):\n<VexaChat layout=\"page\" />";

export function placementSnippet(placement: Placement): string {
  if (placement === "panel") return `<VexaProvider chat={chatDefaults}>\n  {children}\n  <div className="h-[32rem]">\n    <VexaChat />\n  </div>\n</VexaProvider>${PAGE_HINT}`;
  if (placement === "inline") {
    return `<VexaProvider chat={chatDefaults}>\n  {children}\n  <aside className="h-[32rem] border-y border-border">\n    <VexaChat layout="inline" />\n  </aside>\n</VexaProvider>${PAGE_HINT}`;
  }
  return `<VexaProvider chat={chatDefaults}>\n  {children}\n  <VexaChatOverlay />\n</VexaProvider>`;
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/"([a-zA-Z]+)":/g, "$1:");
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : pad + line))
    .join("\n");
}

export function themeSnippet(theme: VexaTheme): string {
  return `<VexaProvider theme={${indent(json(theme), 2)}}>\n  {children}\n  <VexaChatOverlay />\n</VexaProvider>`;
}

const LABELS_SHOWN = ["emptyTitle", "thinking", "startOver", "openAssistant"] as const;

function labelLines(preset: LanguagePreset): string[] {
  const shown = LABELS_SHOWN.flatMap((key) => (preset.labels[key] ? [`      ${key}: ${JSON.stringify(preset.labels[key])},`] : []));
  const hidden = Object.keys(preset.labels).length - shown.length;
  if (hidden > 0) shown.push(`      thoughtFor: (seconds) => \`คิดอยู่ \${seconds} วินาที\`,`, `      // ${hidden - 1} more`);
  return shown;
}

export function labelsSnippet(preset: LanguagePreset): string {
  const lines = labelLines(preset);
  const labels = lines.length === 0 ? "{}" : `{\n${lines.join("\n")}\n    }`;
  return [
    "<VexaProvider",
    "  chat={{",
    `    title: ${JSON.stringify(preset.title)},`,
    `    subtitle: ${JSON.stringify(preset.subtitle)},`,
    `    labels: ${labels},`,
    "  }}",
    `  format={{ locale: ${JSON.stringify(preset.locale)}, currency: ${JSON.stringify(preset.currency)} }}`,
    ">",
  ].join("\n");
}

export function composerSnippet(composer: ChatComposerOptions): string {
  const lines = Object.entries(composer).flatMap(([key, value]) => (value === undefined ? [] : [`    ${key}: ${String(value)},`]));
  return `<VexaProvider\n  chat={{\n    composer: {\n${lines.map((line) => `  ${line}`).join("\n")}\n    },\n  }}\n>\n  {children}\n  <VexaChatOverlay />\n</VexaProvider>`;
}

export function positionSnippet(position: Position, launcherLabel: string): string {
  return `<VexaProvider chat={{ position: ${JSON.stringify(position)}, launcherLabel: ${JSON.stringify(launcherLabel)}, backdrop: false }}>\n  {children}\n  <VexaChatOverlay />\n</VexaProvider>`;
}
