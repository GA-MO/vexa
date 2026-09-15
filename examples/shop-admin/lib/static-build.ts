/** True in the static export (GitHub Pages): no API route exists, so the mock model answers from inside the browser and links use the base path. */
export const STATIC_BUILD = process.env.NEXT_PUBLIC_VEXA_STATIC === "1";
