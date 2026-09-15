/** True when the site is built for a static host (GitHub Pages): no server routes, the playground runs the scripted mock in the browser, the site assistant is off. */
export const STATIC_BUILD = import.meta.env.VITE_VEXA_STATIC === "1";
