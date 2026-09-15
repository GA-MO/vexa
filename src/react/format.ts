export type VexaFormat = {
  locale: string;
  currency: string;
};

export const DEFAULT_FORMAT: VexaFormat = { locale: "en-US", currency: "USD" };

export type Formatter = {
  format: VexaFormat;
  currencySymbol: string;
  number: (value: number, maximumFractionDigits?: number) => string;
  integer: (value: number) => string;
  money: (value: number) => string;
  compact: (value: number, kind?: "number" | "currency" | "percent") => string;
};

function currencySymbolFor(format: VexaFormat) {
  const parts = new Intl.NumberFormat(format.locale, {
    style: "currency",
    currency: format.currency,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? format.currency;
}

function trimDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function validFormat(overrides?: Partial<VexaFormat>): VexaFormat {
  const candidate = { ...DEFAULT_FORMAT, ...overrides };
  try {
    new Intl.NumberFormat(candidate.locale, { style: "currency", currency: candidate.currency }).format(0);
    return candidate;
  } catch (error) {
    console.warn(`Vexa: invalid format ${JSON.stringify(overrides)} (${(error as Error).message}); using ${DEFAULT_FORMAT.locale}/${DEFAULT_FORMAT.currency}`);
    return DEFAULT_FORMAT;
  }
}

export function createFormatter(overrides?: Partial<VexaFormat>): Formatter {
  const format = validFormat(overrides);
  const currencySymbol = currencySymbolFor(format);
  const number = (value: number, maximumFractionDigits = 2) =>
    new Intl.NumberFormat(format.locale, { maximumFractionDigits }).format(value);
  const money = (value: number) =>
    new Intl.NumberFormat(format.locale, {
      style: "currency",
      currency: format.currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  const compact = (value: number, kind: "number" | "currency" | "percent" = "number") => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    const prefix = kind === "currency" ? currencySymbol : "";
    const suffix = kind === "percent" ? "%" : "";
    if (abs >= 1_000_000) return `${sign}${prefix}${trimDecimal(abs / 1_000_000)}M${suffix}`;
    if (abs >= 1_000) return `${sign}${prefix}${trimDecimal(abs / 1_000)}K${suffix}`;
    return `${sign}${prefix}${trimDecimal(abs)}${suffix}`;
  };
  return {
    format,
    currencySymbol,
    number,
    integer: (value) => number(value, 0),
    money,
    compact,
  };
}
