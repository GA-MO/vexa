import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { CatalogGallery } from "@/components/catalog-gallery";
import { ChatElements } from "@/components/chat-elements";
import { Example } from "@/components/example";
import { ExampleAppLink } from "@/components/example-app-link";
import { resolveExampleUrl } from "@/lib/example-urls";

export { Example };

const DefaultAnchor = defaultMdxComponents.a;

function Anchor({ href, ...props }: React.ComponentProps<typeof DefaultAnchor>) {
  return <DefaultAnchor href={href ? resolveExampleUrl(href) : href} {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    a: Anchor,
    CatalogGallery,
    ChatElements,
    Example,
    ExampleAppLink,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
