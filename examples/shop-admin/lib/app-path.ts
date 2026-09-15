const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TRAILING_SLASH = /\/+$/;

/** The route as the app names it: no base path, no trailing slash, so `/vexa/shop-admin/orders/` from a static export equals `/orders`. */
export function appPath(pathname: string): string {
  const withoutBase = BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  const trimmed = withoutBase.replace(TRAILING_SLASH, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function samePath(left: string, right: string): boolean {
  return appPath(left) === appPath(right);
}
