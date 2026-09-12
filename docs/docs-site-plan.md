# Docs Site Plan: `website/` as the public face of Vexa

Status: **In progress** · Revision 3 · 2026-09-12 (framework changed to Vite 8 + React Router 8)
Audience: the team building it and any Claude session picking up a ticket
Companion: `docs/host-integration-spec.md` (library architecture), `DESIGN.md` (tokens)

---

## 0. Why a separate app

`demo/` becomes a **test bench only**: every catalog example, every interactive case, every future regression scenario, driven by test plans and (later) Playwright. It stays plain, fast to iterate, and free to break. The public documentation moves to a new app, `website/`, with three audiences that pull in different directions:

| Audience | Needs | Consequence |
|---|---|---|
| A developer evaluating Vexa | a first impression that proves generative UI is real, in under 10 seconds | a bold, animated, dogfooded landing page |
| A developer integrating Vexa | find the right page in one search, copy code, see a live result | command-palette search, stable URLs, live playgrounds, copy-paste blocks |
| An LLM agent (Claude Code, Cursor, an MCP client) | fetch exactly the text it needs, in Markdown, without scraping HTML | `llms.txt`, raw `.md` per page, a search API, and an MCP server |

The rule for the whole site: **spectacle on the surface, plain text underneath.** Every page is also a Markdown document an agent can read.

---

## 1. Decisions

| Question | Decision | Why |
|---|---|---|
| Location | `website/` next to `demo/`, both depend on `vexa` via `file:..` | no monorepo tooling churn; same pattern that already works for `demo/` |
| Framework | **Vite 8 + React Router 8 (framework mode) + Fumadocs 16** via `fumadocs-core/framework/react-router` | a docs site does not need Next's RSC machinery; Vite 8 (Rolldown) builds fast, React Router gives file routes, SSG `prerender` for every docs page, and resource routes for `/api/chat`, `/api/search`, `/mcp`. Fumadocs officially supports React Router 7/8 and Vite 8 is in `@react-router/dev`'s peer range. Verified versions: vite 8.3.0, react-router 8.3.1, fumadocs-core 16.15.9 |
| `demo/` framework | stays Next 15 for now; upgrade to Next 16 is ticket 0.4 (optional, matches the harness project on 16.3) | the test bench must not block the docs site; the two apps are independent |
| Content source | `website/content/**/*.mdx` written by hand, plus **generated** reference pages (components, actions, config types) from `src/core/catalog.ts` and the TS types | the catalog is already the single source of truth for the model; the docs must not drift from it |
| Live examples | reuse `demo/lib/catalog-gallery.ts` data by moving the pure data into the library as `vexa/examples` (no React), so both apps import it | one set of examples, tested in `demo/`, shown in `website/` |
| Search | Fumadocs' built-in Orama index (client + `/api/search`) | good enough for < 500 pages, no service to run |
| Agent access | `llms.txt`, `llms-full.txt`, `/<slug>.md` raw endpoints, `/api/search?q=` JSON, and an MCP server `vexa-docs` (`search_docs`, `get_page`) | covers file-fetching agents, HTTP agents, and MCP clients without three content pipelines |
| Assistant on the site | `VexaChatOverlay` itself, with host tools `navigate`, `open_section`, `run_example` and a server tool `search_docs` | the docs site is the first real host integration; if it hurts, we fix the library |
| Styling | Tailwind v4 + `vexa/styles.css` tokens; `DESIGN.md` remains the token source; the site adds its own display typography and motion | the docs must look like the product they document |
| Deployment | Vercel with the React Router preset (or any Node host), `website/` root; docs pages prerendered to static HTML + `.md`, resource routes stay server-side for `/api/chat`, `/api/search`, `/mcp` | standard; CDN cache for `.md` and `llms.txt` |

---

## 2. Information architecture

```
/                         Landing: live generative demo, feature strips, install snippet
/docs                     Docs home: three doors (Get started · Host integration · Catalog)
/docs/get-started         install → provider → route → first prompt (5 minutes)
/docs/concepts/*          how it works: spec stream, catalog, state namespaces, host tools, security
/docs/host/*              VexaProvider, host tools, runTool, format, labels, theme, models
/docs/server/*            createVexaHandler, models registry, persona & rules, MCP, guard
/docs/catalog             component index (generated), grouped like /catalog in demo
/docs/catalog/<Name>      one page per component: props table (generated), live example, prompt hints
/docs/actions             submitForm · toast · runTool
/docs/recipes/*           order status card, booking form, dashboard, receipts, i18n, dark mode
/docs/security            threat model, what the library enforces, what the host must do
/docs/reference/*         every exported type, generated
/playground               prompt → stream → SpecView, with spec/JSONL inspector and "copy as example"
/changelog
/llms.txt · /llms-full.txt · /docs/**.md · /api/search · /mcp
```

Every docs page has: title, one-sentence summary (used in `llms.txt`), stable slug, headings with anchors, and a "Copy for AI" button that copies the raw Markdown.

---

## 3. Visual direction

Inherits `DESIGN.md` (indigo → violet, colored shadows, soft blobs) and pushes it further on the landing page only. Docs pages stay calm so code and tables read well.

- **Hero as a live thesis.** A typed prompt ("compare our three plans and recommend one for a team of 8") streams into a real `SpecView` rendering the Plan comparison example, then loops to the next prompt. Not a video: it is the library running.
- **Motion budget.** Landing: scroll-linked reveals, a gradient mesh that drifts, hover lift on cards. Docs: none beyond focus/hover. `prefers-reduced-motion` disables everything.
- **Typography.** A display face with personality for headings (candidates: Instrument Serif or Bricolage Grotesque), IBM Plex Sans for body, IBM Plex Mono for code. Thai fallback through IBM Plex Sans Thai.
- **Command palette (⌘K)** everywhere: pages, headings, components, recipes; recent items; arrow keys; opens in place.
- **Component pages** show the example at chat width (≤ 600 px) inside a fake assistant bubble, because that is where it will live.
- **Dark mode** from day one using the library's own `mode: "system"` tokens; it is also the test that the tokens are complete.

---

## 4. Agent support (LLM-readable docs)

| Surface | Format | Notes |
|---|---|---|
| `/llms.txt` | Markdown index: site summary, then one line per page `- [Title](url.md): summary` | generated at build from frontmatter |
| `/llms-full.txt` | every page concatenated, separated by `---` with a `# Title` and `Source: url` line | size-capped per section; components section generated from the catalog |
| `/docs/<slug>.md` | the page's raw Markdown, frontmatter stripped, generated tables inlined | `Content-Type: text/markdown`, cached |
| `/api/search?q=&limit=` | JSON `{ results: [{ title, url, snippet, headings }] }` | same Orama index the UI uses |
| `/mcp` | MCP server `vexa-docs` with tools `search_docs(query)` → results, `get_page(slug)` → markdown, `list_components()` → catalog summary | reuse `mcp/server.ts` transport code; stdio variant for local editors |
| Headers | `Link: </docs/x.md>; rel="alternate"; type="text/markdown"` on every HTML page | lets agents discover the raw version |

Content rules that make this work: one H1 per page, no information only in images, code blocks labeled with language and file name, every component page has the same section order (Use it when · Props · Example spec · Prompt hints · Related).

---

## 5. Work breakdown

Progress (2026-09-12): done phases 0–4 (0.1–0.3, 1.1–1.4, 2.1–2.3, 3.1–3.3, 4.1, 4.2). Not started 5.1, 5.2, 5.3, 0.4 (optional). Hero frame is flat (no 3D tilt) and cycles examples with a Next example button; code blocks use catppuccin-latte / catppuccin-mocha via `app/lib/code-themes.json` for MDX and `CodeSurface` for runtime code; `/docs/catalog` is `catalog/index.mdx` with `<CatalogGallery />` embedded. Known debt for 5.1: landing Lighthouse mobile performance is 71 because `root.tsx` mounts the search dialog (Orama + all MDX) and `vexa/react` preloads the registry and devtools on every page; `SpecView` should lazy-load devtools and the search index should load on first open. React Router 8 needs Node ≥ 22.22; `website/.nvmrc` pins 22.23.2 (`nvm use`). `dev`, `build` and `typecheck` are plain `react-router` scripts under node; only `start` runs under `bun --env-file=.env.local` so the server sees the OpenRouter key.

Six phases. Each ticket has an owner role, an estimate in days, and a definition of done. Tickets inside a phase can run in parallel unless marked.

### Phase 0 · Foundations (2–3 days)

| # | Ticket | Owner | Days | Done when |
|---|---|---|---|---|
| 0.1 | Scaffold `website/`: Vite 8, `@react-router/dev` 8 framework mode with `ssr: true` and `prerender` for `/docs/**`, `@vitejs/plugin-react` 6, Tailwind 4 via `@tailwindcss/vite`, `fumadocs-core` + `fumadocs-ui` + `fumadocs-mdx` (React Router adapter), `vexa` as `file:..` with tsconfig paths like `demo/`; root scripts `dev:site`, `build:site`, `typecheck` covers it | lib | 1 | `bun run dev:site` serves a hello page with `vexa/styles.css` tokens applied; `build:site` emits static HTML for a sample docs page |
| 0.4 | Optional: upgrade `demo/` to Next 16 (`next@16.3`, codemods, verify `/catalog` and `/api/chat`) | lib | 0.5 | typecheck and both pages pass; not on the critical path |
| 0.2 | Extract example data: move the pure spec data from `demo/lib/catalog-gallery.ts` to `src/examples/` exported as `vexa/examples` (`GALLERY_SECTIONS`, `COMPOSED_EXAMPLES`, `INTERACTIVE_SECTIONS`, `PRIMITIVE_GROUPS`); `demo/` imports from there | lib | 1 | `/catalog` in demo unchanged; typecheck passes; no React in `src/examples` |
| 0.3 | Reference generator script `scripts/generate-reference.ts`: reads `catalog` (zod → props tables with type, nullable, description, example) and emits `website/content/docs/catalog/<Name>.mdx` with a frozen frontmatter and a generated block between markers; also `actions.mdx` | lib | 1 | running the script twice is idempotent; hand-written sections outside the markers survive |

### Phase 1 · Docs core (4–5 days, after 0)

| # | Ticket | Owner | Days | Done when |
|---|---|---|---|---|
| 1.1 | Docs layout: sidebar from `meta.json`, TOC, breadcrumbs, prev/next, "Copy for AI", "Edit on GitHub", theme toggle wired to `VexaProvider theme.mode` | frontend | 2 | every route in §2 renders with placeholder content |
| 1.2 | MDX components: `<Example id>` (renders a `vexa/examples` spec in a chat-width bubble with a Spec/JSONL tab), `<PropsTable>`, `<Callout>`, `<Tabs>`, code blocks with copy and filename | frontend | 1.5 | component pages show live examples |
| 1.3 | Write Get started, Concepts (5 pages), Host (7 pages), Server (5 pages) from `docs/host-integration-spec.md` and `README.md` | writer | 2 | each page ≤ 800 words, has summary frontmatter, passes the content rules in §4 |
| 1.4 | Security page from spec §6 with the threat table and "what you must do as a host" checklist | writer | 0.5 | reviewed by whoever owns `src/core/guard.ts` |

### Phase 2 · Search and agent surfaces (2–3 days, after 1)

| # | Ticket | Owner | Days | Done when |
|---|---|---|---|---|
| 2.1 | ⌘K palette on Orama: pages, headings, components; keyboard nav; recent | frontend | 1 | "barchart horizontal" finds the BarChart page and the Sales dashboard recipe |
| 2.2 | `/llms.txt`, `/llms-full.txt`, `/docs/**.md`, `Link` headers, sitemap, robots | lib | 1 | `curl /docs/host/host-tools.md` returns Markdown; `llms.txt` lists every page with a summary |
| 2.3 | `/api/search` JSON + MCP server `vexa-docs` (http resource route + stdio script) with `search_docs`, `get_page`, `list_components`. First evaluate Fumadocs' built-in MCP integration (`fumadocs-core` peers on `@modelcontextprotocol/server`); write our own only if it cannot serve `get_page` as Markdown | lib | 1 | Claude Code with the MCP configured answers "how do I add a host tool" from the docs |

### Phase 3 · Landing and playground (4–5 days, parallel with 2)

| # | Ticket | Owner | Days | Done when |
|---|---|---|---|---|
| 3.1 | Landing page: hero with the looping live demo (typed prompt → streamed spec from `vexa/examples`, no model call), feature strips, install snippet, footer | frontend + design | 2.5 | Lighthouse ≥ 90 performance on mobile; reduced motion honored |
| 3.2 | `/playground`: prompt box → real `/api/chat` → `SpecView`; side panel with spec JSON, JSONL stream, state; "copy as example" | frontend | 1.5 | a prompt produces UI and the spec can be copied into a test case |
| 3.3 | Site assistant: `VexaChatOverlay` with host tools `navigate`, `open_section`, `run_example` and server tool `search_docs`; persona "you are the Vexa docs guide" | lib | 1 | "show me a receipt example" navigates to the LineItems page and scrolls to the example |

### Phase 4 · Reference and recipes (3 days, after 1)

| # | Ticket | Owner | Days | Done when |
|---|---|---|---|---|
| 4.1 | Hand-written sections for all 41 component pages (Use it when · Prompt hints · Related) on top of the generated tables | writer | 2 | no page has an empty section |
| 4.2 | Recipes: dashboard, order status, receipt, booking, recommendation, trend, i18n, dark mode, per-tenant models | writer | 1 | each recipe is a copy-pasteable page with a live example |

### Phase 5 · Quality gates and release (2 days, after all)

| # | Ticket | Owner | Days | Done when |
|---|---|---|---|---|
| 5.1 | CI: typecheck, build, link check, `llms.txt` freshness (generator diff), Lighthouse budget, axe on 5 pages | lib | 1 | red on drift or regressions |
| 5.2 | Deploy to Vercel with preview per PR; custom domain; analytics on search queries (what people fail to find) | lib | 0.5 | preview URL on every PR |
| 5.3 | Launch review: 10 tasks (find X, copy Y, make an agent answer Z) done by someone who has not seen the site | design | 0.5 | ≥ 8/10 completed without help |

Total: about 18–21 working days for one frontend, one library engineer, one writer working in parallel; roughly 4 weeks calendar.

---

## 6. What `demo/` becomes

First case shipped: `/tests/chat-elements` (`demo/lib/test-plans/chat-elements.ts`) renders every chat part from fixed messages at 340px and 600px.

- Rename nothing. `demo/` stays the test bench with `/`, `/catalog`, and a new `/tests/<case>` route family driven by `demo/lib/test-plans/*.ts` (one file per scenario: state, spec, expected assertions).
- Test plans to write next (separate document): host tool round trip, approval and denial, injection notice, model registry 400s, `runTool` from `watch`, namespace guard, theme dark mode, format locales, MCP against a local stdio server.
- Playwright later runs `/tests/*` headless; until then the SSR + `bun -e` checks in `CLAUDE.md` remain the gate.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Fumadocs upgrade churn | pin the version; keep MDX components ours so a swap only touches the layout |
| React Router 8 + Vite 8 are new majors | pin both; the React Router adapter of Fumadocs is the same one used for RR7, and `@react-router/dev` declares Vite 8 support; fall back to Vite 7 if a plugin breaks |
| Vite/RR has no RSC-style server components | not needed: docs pages are MDX prerendered at build; the only server code is three resource routes |
| Generated reference drifts from hand-written prose | markers in MDX; CI diff on the generator output |
| Landing page motion hurts performance or accessibility | motion budget in §3, Lighthouse gate in 5.1, reduced-motion everywhere |
| The site assistant costs money on every visit | rate limit `/api/chat` by IP, cap `stopWhen` at 3, cheapest model in the registry, no attachments |
| Two apps double the maintenance | shared examples in `vexa/examples`, shared tokens in `vexa/styles.css`; the site imports, never copies |

---

## 8. Open questions

1. Display typeface: Instrument Serif (editorial) vs Bricolage Grotesque (techy). Decide with two landing mockups in Phase 3.
2. Do we publish the site assistant's conversations for analytics (with consent) to learn what people ask? Default no.
3. Domain and whether `/playground` is public or behind a key (cost).
