import { RootProvider } from "fumadocs-ui/provider/react-router";
import { lazy } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { SiteAssistant } from "@/components/site-assistant";
import type { Route } from "./+types/root";
import "./app.css";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap";

const VexaSearchDialog = lazy(() => import("@/components/search-dialog"));

const SEARCH_LINKS: [name: string, href: string][] = [
  ["Get started", "/docs/get-started"],
  ["Host integration", "/docs/host"],
  ["Catalog", "/docs/catalog"],
];

export function links(): Route.LinkDescriptors {
  return [
    { rel: "icon", type: "image/svg+xml", href: `${import.meta.env.BASE_URL}icon.svg` },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "stylesheet", href: GOOGLE_FONTS_URL },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <RootProvider
          theme={{ attribute: ["class", "data-theme"], defaultTheme: "system" }}
          search={{ SearchDialog: VexaSearchDialog, links: SEARCH_LINKS }}
        >
          <SiteAssistant>{children}</SiteAssistant>
        </RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const isResponse = isRouteErrorResponse(error);
  const title = isResponse ? `${error.status} ${error.statusText}` : "Something went wrong";
  const details = isResponse ? error.data : error instanceof Error ? error.message : "";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {details ? <p className="mt-2 text-muted-foreground">{String(details)}</p> : null}
    </main>
  );
}
