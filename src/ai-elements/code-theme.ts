import { createCodePlugin, type ThemeInput } from "@streamdown/code";

const TOKEN_SCOPES: Record<string, string[]> = {
  comment: ["comment", "punctuation.definition.comment", "string.comment"],
  keyword: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "entity.name.tag", "markup.heading"],
  string: ["string", "punctuation.definition.string", "markup.inline.raw", "markup.raw"],
  constant: ["constant", "constant.numeric", "constant.language", "variable.language", "keyword.other.unit", "markup.bold"],
  function: ["entity.name.function", "support.function", "meta.function-call", "entity.name.type", "entity.name.class", "support.type", "support.class"],
  property: ["support.type.property-name", "meta.object-literal.key", "entity.other.attribute-name", "variable.other.property", "variable.other.object.property"],
  variable: ["variable", "variable.parameter", "variable.other", "support.variable", "meta.definition.variable"],
  punctuation: ["punctuation", "meta.brace", "keyword.operator", "punctuation.definition.tag"],
  link: ["markup.underline.link", "string.other.link"],
};

/** Shiki theme whose every color is a `--vexa-code-*` CSS variable, declared in styles.css from the host's tokens. */
export const VEXA_CODE_THEME: ThemeInput = {
  name: "vexa",
  type: "light",
  colors: {
    "editor.background": "var(--vexa-code-bg)",
    "editor.foreground": "var(--vexa-code-fg)",
  },
  settings: [
    { settings: { foreground: "var(--vexa-code-fg)", background: "var(--vexa-code-bg)" } },
    ...Object.entries(TOKEN_SCOPES).map(([token, scope]) => ({
      scope,
      settings: { foreground: `var(--vexa-code-${token})` },
    })),
  ],
};

export const vexaCode = createCodePlugin({ themes: [VEXA_CODE_THEME, VEXA_CODE_THEME] });
