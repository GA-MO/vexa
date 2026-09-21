const HASH_ROUTE = /#(\/[^?]*)/;
const PROTOCOL_RELATIVE = "//";

/** The route a link or location points at, the same for a path router (`/orders`) and a hash router (`#/orders`, `/#/orders`); null for anything that is not an in-app route. */
export function routePath(href: string): string | null {
  const hashRoute = HASH_ROUTE.exec(href);
  if (hashRoute) return withoutTrailingSlash(hashRoute[1]);
  if (!href.startsWith("/") || href.startsWith(PROTOCOL_RELATIVE)) return null;
  return withoutTrailingSlash(href.split(/[?#]/)[0]);
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isRoute(target: string): boolean {
  return target.startsWith("/") || target.startsWith("#/");
}

type LocationLike = { pathname: string; hash: string };

/** The current route of a document: its hash route when the app routes by `#/…`, its pathname otherwise. */
export function pagePath(location: LocationLike): string {
  return routePath(location.hash) ?? routePath(location.pathname) ?? "/";
}

function usesHashRouting(doc: Document): boolean {
  if (doc.location.hash.startsWith("#/")) return true;
  return doc.querySelector('a[href^="#/"], a[href^="/#/"]') !== null;
}

/** The href that opens a route in a document: `#/orders` under a hash router, the path itself otherwise. */
export function hrefForPath(path: string, doc: Document): string {
  return usesHashRouting(doc) ? `${doc.location.pathname}#${path}` : path;
}
