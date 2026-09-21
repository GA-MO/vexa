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

function PressedGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
            value === option ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const HOST_TOOL_MODES = ["on", "off"] as const;

export default function SettingsPage() {
  const { theme, locale, currency, steps, hostToolsEnabled } = useShop();
  const { setTheme, setLocale, setSteps, setHostToolsEnabled } = useShopActions();

  return (
    <PageShell title="Settings" description="Presentation settings the chat can change through set_theme and set_locale.">
      <Panel title="Theme">
        <PressedGroup label="Theme" options={THEMES} value={theme} onChange={setTheme} />
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

      <Panel title="Assistant">
        <div className="flex flex-col gap-2">
          <PressedGroup
            label="Host tools"
            options={HOST_TOOL_MODES}
            value={hostToolsEnabled ? "on" : "off"}
            onChange={(mode) => setHostToolsEnabled(mode === "on")}
          />
          <p className="text-sm text-muted-foreground">Off: the assistant drives every page through admin_run only.</p>
        </div>
      </Panel>
    </PageShell>
  );
}
