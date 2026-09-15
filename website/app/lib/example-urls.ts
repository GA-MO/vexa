export type ExampleApp = "shop-admin" | "widget";

const LOCAL_EXAMPLE_URLS: Record<string, ExampleApp> = {
  "http://localhost:3001": "shop-admin",
  "http://localhost:3003": "widget",
};

const DEPLOYED_EXAMPLE_URLS: Record<ExampleApp, string | undefined> = {
  "shop-admin": import.meta.env.VITE_VEXA_SHOP_ADMIN_URL,
  widget: import.meta.env.VITE_VEXA_WIDGET_URL,
};

/** Where an example app runs: the hosted build on a deployed site, its dev server otherwise. */
export function exampleAppUrl(app: ExampleApp, path = "/"): string {
  const local = Object.entries(LOCAL_EXAMPLE_URLS).find(([, name]) => name === app)?.[0] ?? "";
  const origin = (DEPLOYED_EXAMPLE_URLS[app] ?? local).replace(/\/$/, "");
  return `${origin}${path}`;
}

/** Docs content links the example apps by their dev-server origins; a deployed site rewrites them to wherever the examples are hosted. */
export function resolveExampleUrl(href: string): string {
  for (const [origin, app] of Object.entries(LOCAL_EXAMPLE_URLS)) {
    const deployed = DEPLOYED_EXAMPLE_URLS[app];
    if (deployed && href.startsWith(origin)) return deployed.replace(/\/$/, "") + href.slice(origin.length);
  }
  return href;
}
