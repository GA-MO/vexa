declare module "virtual:example-pages" {
  export const EXAMPLE_PAGES: Record<string, readonly string[]>;
}

interface ImportMetaEnv {
  readonly VITE_VEXA_STATIC?: string;
  readonly VITE_VEXA_BASE_PATH?: string;
}

interface ImportMetaEnv {
  readonly VITE_VEXA_SHOP_ADMIN_URL?: string;
  readonly VITE_VEXA_WIDGET_URL?: string;
}
