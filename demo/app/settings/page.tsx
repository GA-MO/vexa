"use client";

import { cn } from "vexa/react";
import { PageShell, Panel } from "@/components/shop/page-shell";
import { CURRENCIES, LOCALES, STEPS_MODES, THEMES, useShop, useShopActions, type Currency, type Locale } from "@/lib/shop/store";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function SettingsPage() {
  const { theme, locale, currency, steps } = useShop();
  const { setTheme, setLocale, setSteps } = useShopActions();

  return (
    <PageShell title="Settings" description="Presentation settings the chat can change through set_theme and set_locale.">
      <Panel title="Theme">
        <div role="group" aria-label="Theme" className="flex gap-1">
          {THEMES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              onClick={() => setTheme(option)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                theme === option
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Locale and currency">
        <div className="flex flex-wrap gap-4">
          <Field label="Locale">
            <select className={SELECT_CLASS} value={locale} onChange={(event) => setLocale(event.target.value as Locale, currency)}>
              {LOCALES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <select className={SELECT_CLASS} value={currency} onChange={(event) => setLocale(locale, event.target.value as Currency)}>
              {CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>

      <Panel title="Chat">
        <Field label="Steps display">
          <select className={cn(SELECT_CLASS, "max-w-xs")} value={steps} onChange={(event) => setSteps(event.target.value as typeof steps)}>
            {STEPS_MODES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </Panel>
    </PageShell>
  );
}
