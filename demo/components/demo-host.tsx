"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { defineTool, VexaProvider } from "vexa/react";

const ROUTES = ["/", "/catalog"] as const;
const CITIES: Record<string, string[]> = {
  TH: ["Bangkok", "Chiang Mai", "Phuket"],
  US: ["San Francisco", "New York", "Austin"],
  JP: ["Tokyo", "Osaka", "Kyoto"],
};
const CATALOG_TABS = ["composed", "primitives", "interactive", "chrome"] as const;

export function DemoHost({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <VexaProvider
      format={{ locale: "en-US", currency: "THB" }}
      chat={{
        title: "Vexa demo assistant",
        subtitle: "Controls this site · renders UI",
        launcherLabel: "Ask Vexa",
        suggestions: [
          { label: "Open BarChart", prompt: "Take me to the catalog and open the BarChart example." },
          { label: "KPI dashboard", prompt: "Build a quarterly sales dashboard with three metrics and a bar chart." },
          { label: "Compare plans", prompt: "Compare the Free, Pro and Enterprise plans in a table and recommend one for a team of 8." },
          { label: "Dark theme", prompt: "Switch this page to the dark theme." },
        ],
      }}
      context={() => ({
        path: window.location.pathname,
        hash: window.location.hash.replace(/^#/, ""),
        theme: document.documentElement.dataset.theme ?? "light",
      })}
      contextSchema={z.object({ path: z.string(), hash: z.string(), theme: z.string() })}
      tools={{
        navigate: defineTool({
          description: "Open a page of this demo site. Use hash to deep-link into the catalog, for example primitives/bar-chart.",
          input: z.object({ to: z.enum(ROUTES), hash: z.string().optional() }),
          run: ({ to, hash }) => {
            router.push(hash ? `${to}#${hash}` : to);
            return { ok: true, summary: `Opened ${to}${hash ? `#${hash}` : ""}` };
          },
        }),
        open_catalog_item: defineTool({
          description: "Scroll the catalog page to one component or example. item is the section id, for example bar-chart, order-status, bind-form.",
          input: z.object({ tab: z.enum(CATALOG_TABS), item: z.string().min(1) }),
          run: ({ tab, item }) => {
            const target = `/catalog#${tab}/${item}`;
            if (window.location.pathname !== "/catalog") router.push(target);
            else window.location.hash = `${tab}/${item}`;
            return { ok: true, summary: `Showing ${tab} › ${item}` };
          },
        }),
        load_cities: defineTool({
          description: "List the cities available for a country code (TH, US, JP).",
          input: z.object({ country: z.string().min(2).max(2) }),
          run: ({ country }) => {
            const cities = CITIES[country.toUpperCase()] ?? [];
            return { ok: true, summary: `${cities.length} cities for ${country.toUpperCase()}`, data: { cities } };
          },
        }),
        set_theme: defineTool({
          description: "Switch the page between light and dark theme.",
          input: z.object({ theme: z.enum(["light", "dark"]) }),
          confirm: true,
          run: ({ theme }) => {
            document.documentElement.dataset.theme = theme;
            document.documentElement.classList.toggle("dark", theme === "dark");
            return { ok: true, summary: `Theme set to ${theme}`, data: { theme } };
          },
        }),
      }}
    >
      {children}
    </VexaProvider>
  );
}
