import type { CSSProperties } from "react";

export type VexaThemeMode = "light" | "dark" | "system";

export type VexaTheme = {
  primary?: string;
  primaryDark?: string;
  secondary?: string;
  secondaryDark?: string;
  radius?: string;
  chart?: readonly string[];
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  mode?: VexaThemeMode;
  /** `false` removes the tinted glow: the panel and launcher shadows, the launcher halo, and the blurred blobs behind the chat. */
  glow?: boolean;
};

type CssVars = Record<`--${string}`, string>;

export function themeStyle(theme: VexaTheme | undefined): CSSProperties {
  if (!theme) return {};
  const vars: CssVars = {};
  if (theme.primary) {
    vars["--primary"] = theme.primary;
    vars["--ring"] = theme.primary;
  }
  if (theme.primaryDark) vars["--vexa-primary-dark"] = theme.primaryDark;
  if (theme.secondary) vars["--brand-violet"] = theme.secondary;
  if (theme.secondaryDark) vars["--vexa-secondary-dark"] = theme.secondaryDark;
  if (theme.radius) vars["--radius"] = theme.radius;
  if (theme.success) vars["--vexa-success"] = theme.success;
  if (theme.warning) vars["--vexa-warning"] = theme.warning;
  if (theme.danger) vars["--vexa-danger"] = theme.danger;
  if (theme.info) vars["--vexa-info"] = theme.info;
  theme.chart?.slice(0, 5).forEach((color, index) => {
    vars[`--chart-${index + 1}`] = color;
  });
  return vars as CSSProperties;
}
