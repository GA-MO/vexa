"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "vexa/ui/select";
import { CATEGORIES, PRODUCT_STATUSES, type Category, type ProductInput, type ProductStatus } from "@/lib/shop/data";

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-primary to-brand-violet px-3 text-sm font-medium text-primary-foreground";
const SECONDARY_LINK_CLASS = "inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted";

export const EMPTY_PRODUCT: ProductInput = { name: "", sku: "", price: 0, category: "Beans", status: "draft" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function CategoryField({ value, onChange }: { value: Category; onChange: (category: Category) => void }) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span id={labelId} className="font-medium text-foreground">
        Category
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as Category)}>
        <SelectTrigger aria-labelledby={labelId} className="h-9 w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: ProductInput;
  submitLabel: string;
  onSubmit: (input: ProductInput) => void;
}) {
  const [draft, setDraft] = useState<ProductInput>(initial);
  const patch = (partial: Partial<ProductInput>) => setDraft((current) => ({ ...current, ...partial }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ ...draft, name: draft.name.trim(), sku: draft.sku.trim() });
  };

  return (
    <form aria-label={submitLabel} onSubmit={submit} className="flex max-w-lg flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <Field label="Name">
        <input required value={draft.name} onChange={(event) => patch({ name: event.target.value })} className={INPUT_CLASS} />
      </Field>
      <Field label="SKU">
        <input required value={draft.sku} onChange={(event) => patch({ sku: event.target.value })} className={INPUT_CLASS} />
      </Field>
      <Field label="Price">
        <input
          type="number"
          required
          min={0}
          step="any"
          value={draft.price}
          onChange={(event) => patch({ price: Number(event.target.value) })}
          className={INPUT_CLASS}
        />
      </Field>
      <CategoryField value={draft.category} onChange={(category) => patch({ category })} />
      <Field label="Status">
        <select value={draft.status} onChange={(event) => patch({ status: event.target.value as ProductStatus })} className={INPUT_CLASS}>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          {submitLabel}
        </button>
        <Link href="/products" className={SECONDARY_LINK_CLASS}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
