const PLACEHOLDER_SITE_URL = "https://vexa.example.com";
const TRAILING_SLASHES = /\/+$/;

function resolveSiteUrl() {
  const configured = process.env.VEXA_SITE_URL?.trim();
  const base = configured && configured.length > 0 ? configured : PLACEHOLDER_SITE_URL;
  return base.replace(TRAILING_SLASHES, "");
}

/** Origin used by llms.txt, llms-full.txt and sitemap.xml. Set `VEXA_SITE_URL` once the domain is decided. */
export const SITE_URL = resolveSiteUrl();

/** Turns a root-relative path such as `/docs/get-started.md` into an absolute URL. */
export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
