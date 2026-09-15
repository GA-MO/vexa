import { PROMPTS } from "./mock-script";
import type { VexaTheme } from "vexa/react";
import type { LanguagePreset, Position } from "./presets";

export type GuideId = "theme" | "labels" | "position" | "placement";

export type Guide = {
  id: GuideId;
  title: string;
  what: string[];
  docs: string;
  prompts: string[];
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
    title: "Overlay, inline panel, or full page",
    what: [
      "`VexaChatOverlay` is the floating launcher plus panel. The same chat also renders inline: `<VexaChat />` fills whatever box you give it as a bordered panel, and `<VexaChat layout=\"page\" />` takes the whole viewport for a dedicated assistant route.",
      "All three read the provider's `chat` defaults, so switching placement changes one line; the prompt below goes to whichever chat is mounted.",
    ],
    docs: "host/provider",
    prompts: [PROMPTS.usage],
  },
];

export type Placement = "overlay" | "inline";

export const PLACEMENTS: Placement[] = ["overlay", "inline"];

export function placementSnippet(placement: Placement): string {
  if (placement === "inline") {
    return `<VexaProvider chat={chatDefaults}>\n  {children}\n  <div className="h-[32rem]">\n    <VexaChat />\n  </div>\n</VexaProvider>\n\n// a dedicated route instead:\n<VexaChat layout="page" />`;
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

export function positionSnippet(position: Position, launcherLabel: string): string {
  return `<VexaProvider chat={{ position: ${JSON.stringify(position)}, launcherLabel: ${JSON.stringify(launcherLabel)}, backdrop: false }}>\n  {children}\n  <VexaChatOverlay />\n</VexaProvider>`;
}
