import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Link } from "react-router";
import { MOVED_DOCS_PAGES } from "@/lib/docs-redirects";
import { baseOptions } from "@/lib/layout.shared";
import { DOCS_BASE_URL } from "@/lib/source";

const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "");

/** GitHub Pages serves this file for any unknown path; the inline script sends moved docs URLs to their new home before React loads. */
const REDIRECT_SCRIPT = `(function(){var base=${JSON.stringify(BASENAME)};var docs=base+${JSON.stringify(DOCS_BASE_URL)};var moved=${JSON.stringify(MOVED_DOCS_PAGES)};var path=location.pathname.replace(/\\/$/,"");if(path.indexOf(docs+"/")!==0)return;var slug=path.slice(docs.length+1);if(!(slug in moved))return;var target=moved[slug];location.replace(target?docs+"/"+target:docs);})();`;

export function meta() {
  return [{ title: "Not found | Vexa" }];
}

export default function NotFoundRoute() {
  return (
    <HomeLayout {...baseOptions()}>
      <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page moved or never existed. Start from the <Link to="/docs">docs</Link> or the <Link to="/">home page</Link>.
        </p>
      </main>
    </HomeLayout>
  );
}
