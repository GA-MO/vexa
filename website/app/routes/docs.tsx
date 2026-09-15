import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/docs/page";
import { data, redirect } from "react-router";
import { DocsHome, DocsSectionPlaceholder } from "@/components/docs-placeholders";
import { useMDXComponents } from "@/components/mdx";
import { movedDocsUrl } from "@/lib/docs-redirects";
import { findDocsSection, type DocsSection } from "@/lib/docs-sections";
import { baseOptions, DOCS_CONTENT_GITHUB_URL } from "@/lib/layout.shared";
import { DOCS_BASE_URL, docs, source } from "@/lib/source";
import type { Route } from "./+types/docs";


type DocsView =
  | { kind: "page"; path: string; slug: string }
  | { kind: "section"; section: DocsSection }
  | { kind: "home" };

function toSlugs(splat: string | undefined) {
  return (splat ?? "").split("/").filter((segment) => segment.length > 0);
}

function resolveView(slugs: string[]): DocsView {
  const page = source.getPage(slugs);
  if (page) return { kind: "page", path: page.path, slug: slugs.join("/") };

  const section = findDocsSection(slugs);
  if (section) return { kind: "section", section };

  if (slugs.length === 0) return { kind: "home" };
  throw new Response("Not found", { status: 404 });
}

function markdownPathFor(slug: string) {
  return `${DOCS_BASE_URL}/${slug}.md`;
}

function markdownAlternateHeaders(view: DocsView) {
  if (view.kind !== "page") return undefined;
  return { Link: `<${markdownPathFor(view.slug)}>; rel="alternate"; type="text/markdown"` };
}

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = toSlugs(params["*"]);
  const moved = movedDocsUrl(slugs);
  if (moved !== undefined) throw redirect(moved, 301);
  const view = resolveView(slugs);
  const pageTree = await source.serializePageTree(source.getPageTree());

  return data({ view, pageTree }, { headers: markdownAlternateHeaders(view) });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

function PageActions({ path, slug }: { path: string; slug: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MarkdownCopyButton markdownUrl={markdownPathFor(slug)}>Copy for AI</MarkdownCopyButton>
      <EditOnGitHub href={`${DOCS_CONTENT_GITHUB_URL}/${path}`} />
    </div>
  );
}

function ContentPage({ path, slug }: { path: string; slug: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`Unknown docs page: ${path}`);

  const Mdx = page.body;

  return (
    <DocsPage
      toc={page.toc}
      tableOfContent={{ style: "clerk" }}
      breadcrumb={{ includeRoot: { url: DOCS_BASE_URL }, includePage: true }}
    >
      <title>{`${page.title} | Vexa`}</title>
      <meta name="description" content={page.description} />
      <link rel="alternate" type="text/markdown" href={markdownPathFor(slug)} />
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <PageActions path={path} slug={slug} />
      <DocsBody>
        <Mdx components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

function SectionPage({ section }: { section: DocsSection }) {
  return <DocsSectionPlaceholder {...section} />;
}

function DocsContent({ view }: { view: DocsView }) {
  if (view.kind === "page") return <ContentPage path={view.path} slug={view.slug} />;
  if (view.kind === "section") return <SectionPage section={view.section} />;
  return <DocsHome />;
}

export default function DocsRoute({ loaderData }: Route.ComponentProps) {
  const { view, pageTree } = useFumadocsLoader(loaderData);

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <DocsContent view={view} />
    </DocsLayout>
  );
}
