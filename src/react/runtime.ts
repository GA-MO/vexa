"use client";

import type { ComputedFunction } from "@json-render/core";
import type { StateStore } from "@json-render/react";
import { standardDirectives } from "@json-render/directives";

const CITY_OPTIONS: Record<string, string[]> = {
  TH: ["Bangkok", "Chiang Mai", "Phuket"],
  US: ["San Francisco", "New York", "Austin"],
  JP: ["Tokyo", "Osaka", "Kyoto"],
};

export const agenticDirectives = standardDirectives;

export const agenticFunctions: Record<string, ComputedFunction> = {
  fullName: (args) =>
    `${String(args.first ?? "")} ${String(args.last ?? "")}`.trim(),
  formatCurrency: (args) => {
    const value = Number(args.value ?? 0);
    const currency = String(args.currency ?? "THB");
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  },
};

/** Handlers closed over a SpecView store (path-style set). */
export function createAgenticHandlers(store: StateStore) {
  return {
    submitForm: async (params: Record<string, unknown>) => {
      const path =
        typeof params.statePath === "string" && params.statePath.length > 0
          ? params.statePath
          : "/lastSubmit";
      const form = store.get("/form");
      store.set(path, { form, at: new Date().toISOString() });
    },
    loadCities: async (params: Record<string, unknown>) => {
      const country = String(params.country ?? "").toUpperCase();
      store.set("/availableCities", CITY_OPTIONS[country] ?? []);
      store.set("/form/city", "");
    },
    toast: async (params: Record<string, unknown>) => {
      store.set("/toast", String(params.message ?? ""));
    },
  };
}

/** defineRegistry action stubs (updater-style setState). */
export const registryActions = {
  submitForm: async (
    params: { statePath?: string | null } | undefined,
    setState: (
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => void,
    state: Record<string, unknown>,
  ) => {
    setState((prev) => ({
      ...prev,
      lastSubmit: {
        form: (state as { form?: unknown }).form ?? prev.form,
        at: new Date().toISOString(),
        path: params?.statePath ?? "/lastSubmit",
      },
    }));
  },
  loadCities: async (
    params: { country?: string } | undefined,
    setState: (
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => void,
  ) => {
    const country = String(params?.country ?? "").toUpperCase();
    setState((prev) => ({
      ...prev,
      availableCities: CITY_OPTIONS[country] ?? [],
      form: {
        ...((prev.form as Record<string, unknown> | undefined) ?? {}),
        city: "",
      },
    }));
  },
  toast: async (
    params: { message?: string } | undefined,
    setState: (
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => void,
  ) => {
    setState((prev) => ({
      ...prev,
      toast: String(params?.message ?? ""),
    }));
  },
};
