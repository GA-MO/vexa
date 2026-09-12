import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { catalog } from "../src/core/catalog";
import { GALLERY_SECTIONS, PRIMITIVE_GROUPS } from "../src/examples";

const CONTENT_DIR = join(import.meta.dirname, "../website/content/docs");
const CATALOG_DIR = join(CONTENT_DIR, "catalog");
const GENERATED_START = "{/* generated:start */}";
const GENERATED_END = "{/* generated:end */}";
const NULLABLE_NOTE =
  "> Nullable props are optional from the model's point of view: the model must send `null` explicitly, it cannot omit the key.";
const PROPS_TABLE_HEADER = "| Prop | Type | Required | Description |\n| --- | --- | --- | --- |";
const COMPONENT_SECTIONS = ["Use it when", "Prompt hints", "Related"];
const ACTION_SECTIONS = ["Overview"];
const PLACEHOLDER_TEXT = "_This section is written by hand. Replace this sentence._";

type ZodNode = {
  description?: string;
  def: {
    type: string;
    innerType?: ZodNode;
    element?: ZodNode;
    shape?: Record<string, ZodNode>;
    entries?: Record<string, string | number>;
    options?: ZodNode[];
    keyType?: ZodNode;
    valueType?: ZodNode;
    values?: unknown[];
  };
};

type ComponentDefinition = {
  props: unknown;
  slots?: string[];
  description?: string;
  example?: unknown;
};

type ActionDefinition = {
  params: unknown;
  description?: string;
};

const componentDefinitions = catalog.data.components as Record<string, ComponentDefinition>;
const actionDefinitions = catalog.data.actions as Record<string, ActionDefinition>;

function asNode(schema: unknown): ZodNode {
  return schema as ZodNode;
}

function formatEnum(entries: Record<string, string | number>) {
  return Object.values(entries)
    .map((value) => JSON.stringify(value))
    .join(" | ");
}

function formatObject(shape: Record<string, ZodNode>) {
  const fields = Object.entries(shape).map(([key, node]) => `${key}: ${formatType(node)}`);
  return `{ ${fields.join("; ")} }`;
}

function formatType(node: ZodNode): string {
  const { def } = node;
  switch (def.type) {
    case "nullable":
      return `${formatType(def.innerType!)} | null`;
    case "optional":
      return `${formatType(def.innerType!)} | undefined`;
    case "array": {
      const element = formatType(def.element!);
      return element.includes(" | ") ? `(${element})[]` : `${element}[]`;
    }
    case "object":
      return formatObject(def.shape!);
    case "record":
      return `Record<${formatType(def.keyType!)}, ${formatType(def.valueType!)}>`;
    case "union":
      return def.options!.map(formatType).join(" | ");
    case "enum":
      return formatEnum(def.entries!);
    case "literal":
      return def.values!.map((value) => JSON.stringify(value)).join(" | ");
    default:
      return def.type;
  }
}

function isNullable(node: ZodNode) {
  return node.def.type === "nullable" || node.def.type === "optional";
}

function escapeTableCell(text: string) {
  return text.replace(/\|/g, "\\|");
}

function describeProp(node: ZodNode, exampleValue: unknown) {
  if (node.description) return node.description;
  if (exampleValue === undefined) return "";
  return `Example: \`${escapeTableCell(JSON.stringify(exampleValue))}\``;
}

function propsTable(schema: unknown, example: unknown) {
  const shape = asNode(schema).def.shape ?? {};
  const exampleRecord = (example ?? {}) as Record<string, unknown>;
  const rows = Object.entries(shape).map(([name, node]) => {
    const type = `\`${escapeTableCell(formatType(node))}\``;
    const required = isNullable(node) ? "No" : "Yes";
    const description = describeProp(node, exampleRecord[name]);
    return `| \`${name}\` | ${type} | ${required} | ${description} |`;
  });
  return [NULLABLE_NOTE, "", PROPS_TABLE_HEADER, ...rows].join("\n");
}

function jsonBlock(title: string, value: unknown) {
  return `\`\`\`json title="${title}"\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

function gallerySectionsFor(componentName: string) {
  return GALLERY_SECTIONS.filter((section) =>
    section.component.split(",").some((entry) => entry.trim() === componentName),
  );
}

function liveExampleSection(componentName: string) {
  const sections = gallerySectionsFor(componentName);
  if (sections.length === 0) return [];
  const examples = sections.map((section) => `<Example id="${section.id}" />`);
  return ["## Live example", "", ...examples];
}

function componentGeneratedZone(name: string, definition: ComponentDefinition) {
  const slots = definition.slots?.length
    ? ["", `Slots: ${definition.slots.map((slot) => `\`${slot}\``).join(", ")}`]
    : [];
  return [
    GENERATED_START,
    "",
    "## Props",
    "",
    propsTable(definition.props, definition.example),
    ...slots,
    "",
    "## Example spec",
    "",
    jsonBlock("spec.json", { type: name, props: definition.example ?? {} }),
    "",
    ...liveExampleSection(name),
    "",
    GENERATED_END,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function actionGeneratedZone() {
  const blocks = Object.entries(actionDefinitions).flatMap(([name, definition]) => [
    `## ${name}`,
    "",
    definition.description ?? "",
    "",
    propsTable(definition.params, undefined),
    "",
  ]);
  return [GENERATED_START, "", ...blocks, GENERATED_END].join("\n").replace(/\n{3,}/g, "\n\n");
}

function frontmatter(title: string, description: string) {
  return ["---", `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`, "---"].join(
    "\n",
  );
}

function placeholderZone(headings: string[]) {
  return headings.flatMap((heading) => [`## ${heading}`, "", PLACEHOLDER_TEXT, ""]).join("\n");
}

function newPage(title: string, description: string, headings: string[], generatedZone: string) {
  return `${frontmatter(title, description)}\n\n${placeholderZone(headings)}\n${generatedZone}\n`;
}

function replaceGeneratedZone(existing: string, generatedZone: string) {
  const start = existing.indexOf(GENERATED_START);
  const end = existing.indexOf(GENERATED_END);
  if (start === -1 || end === -1) return `${existing.trimEnd()}\n\n${generatedZone}\n`;
  const before = existing.slice(0, start);
  const after = existing.slice(end + GENERATED_END.length);
  return `${before}${generatedZone}${after}`;
}

async function readIfExists(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

type PageInput = { path: string; title: string; description: string; headings: string[]; generatedZone: string };

async function writePage({ path, title, description, headings, generatedZone }: PageInput) {
  const existing = await readIfExists(path);
  const next =
    existing === null
      ? newPage(title, description, headings, generatedZone)
      : replaceGeneratedZone(existing, generatedZone);
  if (next !== existing) await writeFile(path, next);
}

function componentsInSection(sectionId: string) {
  const section = GALLERY_SECTIONS.find((entry) => entry.id === sectionId);
  if (!section) return [];
  return section.component.split(",").map((entry) => entry.trim());
}

function uniqueCatalogNames(names: string[], placed: Set<string>) {
  const unique: string[] = [];
  for (const name of names) {
    if (!(name in componentDefinitions) || placed.has(name)) continue;
    placed.add(name);
    unique.push(name);
  }
  return unique;
}

function catalogMetaPages() {
  const componentNames = Object.keys(componentDefinitions);
  const placed = new Set<string>();
  const pages: string[] = [];
  for (const group of PRIMITIVE_GROUPS) {
    const names = uniqueCatalogNames(group.sections.flatMap(componentsInSection), placed);
    if (names.length === 0) continue;
    pages.push(`---${group.label}---`, ...names);
  }
  const leftovers = componentNames.filter((name) => !placed.has(name));
  if (leftovers.length > 0) pages.push("---Other---", ...leftovers);
  return pages;
}

async function writeCatalogMeta() {
  const meta = { title: "Catalog", pages: catalogMetaPages() };
  const path = join(CATALOG_DIR, "meta.json");
  const next = `${JSON.stringify(meta, null, 2)}\n`;
  if ((await readIfExists(path)) !== next) await writeFile(path, next);
}

async function generate() {
  await mkdir(CATALOG_DIR, { recursive: true });
  for (const [name, definition] of Object.entries(componentDefinitions)) {
    await writePage({
      path: join(CATALOG_DIR, `${name}.mdx`),
      title: name,
      description: definition.description ?? "",
      headings: COMPONENT_SECTIONS,
      generatedZone: componentGeneratedZone(name, definition),
    });
  }
  await writeCatalogMeta();
  await writePage({
    path: join(CONTENT_DIR, "actions.mdx"),
    title: "Actions",
    description: "The built-in spec actions a button or watcher can trigger: runTool, submitForm, and toast.",
    headings: ACTION_SECTIONS,
    generatedZone: actionGeneratedZone(),
  });
  console.log(`Generated ${Object.keys(componentDefinitions).length} component pages, meta.json, and actions.mdx`);
}

await generate();
