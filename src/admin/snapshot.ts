import { pagePath, routePath } from "./paths";
export type SnapshotElement = {
  ref: string;
  role: string;
  name?: string;
  within?: string;
  href?: string;
  value?: string;
  options?: string[];
  checked?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  sensitive?: boolean;
  columns?: string[];
  rows?: number;
};

export type Snapshot = {
  path: string;
  title: string;
  elements: SnapshotElement[];
  unnamed: number;
  truncated?: boolean;
};

export type SnapshotCapture = {
  snapshot: Snapshot;
  refs: Map<string, Element>;
};

export type PageInfo = { path: string; title: string };

export const SNAPSHOT_ELEMENT_LIMIT = 120;
export const TEXT_LIMIT = 80;
export const SMALL_TABLE_ROWS = 5;

export const INTERACTIVE_ROLES = new Set([
  "link",
  "button",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "treeitem",
  "gridcell",
  "textbox",
  "searchbox",
  "spinbutton",
  "combobox",
  "listbox",
  "option",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "tab",
]);

export const SCOPING_ROLES = new Set(["group", "form", "table", "dialog", "alertdialog", "tablist"]);

const STRUCTURAL_ROLES = new Set([...SCOPING_ROLES, "heading"]);

export const SCOPE_ONLY_ROLES = new Set(["row", "cell"]);

const REF_LETTERS: Record<string, string> = {
  link: "l",
  button: "b",
  menuitem: "m",
  menuitemcheckbox: "m",
  menuitemradio: "m",
  treeitem: "v",
  gridcell: "x",
  textbox: "i",
  searchbox: "i",
  spinbutton: "n",
  slider: "n",
  combobox: "s",
  listbox: "s",
  option: "o",
  checkbox: "c",
  radio: "c",
  switch: "c",
  tab: "a",
  tablist: "a",
  group: "g",
  form: "f",
  table: "t",
  dialog: "d",
  alertdialog: "d",
  heading: "h",
};

const INPUT_ROLES: Record<string, string> = {
  button: "button",
  submit: "button",
  reset: "button",
  image: "button",
  checkbox: "checkbox",
  radio: "radio",
  range: "slider",
  number: "spinbutton",
  search: "searchbox",
};

const SKIPPED_INPUT_TYPES = new Set(["hidden", "file", "color", "date", "time", "datetime-local", "month", "week"]);

const SENSITIVE_AUTOCOMPLETE = /password|cc-|one-time-code/;

const HEADING_TAG = /^H[1-6]$/;

const CONTENT_NAME_ROLES = new Set(["button", "link", "option", "tab", "heading", "cell", "menuitem", "menuitemcheckbox", "menuitemradio", "treeitem", "gridcell"]);

const FORM_CONTROL_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA", "BUTTON"]);

export function collapse(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, TEXT_LIMIT);
}

function isInput(el: Element): el is HTMLInputElement {
  return el.tagName === "INPUT";
}

function implicitRole(el: Element): string | null {
  const tag = el.tagName;
  if (tag === "A") return el.hasAttribute("href") ? "link" : null;
  if (tag === "BUTTON" || tag === "SUMMARY") return "button";
  if (tag === "TEXTAREA") return "textbox";
  if (tag === "SELECT") return (el as HTMLSelectElement).multiple ? "listbox" : "combobox";
  if (tag === "FORM") return "form";
  if (tag === "TABLE") return "table";
  if (tag === "TR") return "row";
  if (tag === "TD" || tag === "TH") return "cell";
  if (tag === "DIALOG") return "dialog";
  if (tag === "FIELDSET") return "group";
  if (HEADING_TAG.test(tag)) return "heading";
  if (!isInput(el)) return null;
  if (SKIPPED_INPUT_TYPES.has(el.type)) return null;
  return INPUT_ROLES[el.type] ?? "textbox";
}

function isKnownRole(role: string) {
  return INTERACTIVE_ROLES.has(role) || STRUCTURAL_ROLES.has(role) || SCOPE_ONLY_ROLES.has(role);
}

export function roleOf(el: Element): string | null {
  const explicit = el.getAttribute("role")?.trim().split(/\s+/)[0];
  if (explicit) return isKnownRole(explicit) ? explicit : null;
  return implicitRole(el);
}

function isStyleHidden(el: Element): boolean {
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!style) return false;
  return style.display === "none" || style.visibility === "hidden";
}

/** Marks a subtree the model must never see or drive: Vexa's own chat, tray and dev controls carry it; a host adds it to its own widgets. */
export const IGNORE_ATTRIBUTE = "data-vexa-ignore";

export function isIgnored(el: Element): boolean {
  return el.hasAttribute(IGNORE_ATTRIBUTE);
}

export function isInsideIgnored(el: Element): boolean {
  return el.closest(`[${IGNORE_ATTRIBUTE}]`) !== null;
}

export function isHidden(el: Element): boolean {
  if (isIgnored(el)) return true;
  if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return true;
  if (el.tagName === "DIALOG" && !(el as HTMLDialogElement).open) return true;
  const checkVisibility = (el as HTMLElement).checkVisibility;
  if (typeof checkVisibility !== "function") return isStyleHidden(el);
  if (checkVisibility.call(el, { visibilityProperty: true })) return false;
  return !isBoxlessWrapper(el);
}

function isBoxlessWrapper(el: Element): boolean {
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  return style?.display === "contents";
}

function isFormControl(el: Element) {
  return FORM_CONTROL_TAGS.has(el.tagName);
}

function textOfNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  if (isFormControl(el)) return "";
  if (el.tagName === "IMG") return el.getAttribute("alt") ?? "";
  const own = el.getAttribute("aria-label");
  if (own && el.tagName.toLowerCase() === "svg") return own;
  return textExcludingControls(el);
}

function textExcludingControls(el: Element): string {
  return Array.from(el.childNodes).map(textOfNode).join("");
}

function labelledByText(el: Element): string {
  const ids = el.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
  return ids
    .map((id) => el.ownerDocument.getElementById(id))
    .map((target) => (target ? textExcludingControls(target) : ""))
    .join(" ");
}

function associatedLabelText(el: Element): string {
  if (!isFormControl(el)) return "";
  const id = el.getAttribute("id");
  const byFor = id ? el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
  const label = byFor ?? el.closest("label");
  return label ? textExcludingControls(label) : "";
}

export function rowText(row: Element): string {
  return Array.from(row.children)
    .map((cell) => collapse(cell.textContent))
    .filter(Boolean)
    .join(" ");
}

function tableCaption(el: Element): string {
  const caption = el.tagName === "TABLE" ? el.querySelector("caption") : null;
  return caption ? textExcludingControls(caption) : "";
}

export function accessibleName(el: Element, role: string): string {
  const candidates = [
    () => labelledByText(el),
    () => el.getAttribute("aria-label") ?? "",
    () => associatedLabelText(el),
    () => (role === "row" ? rowText(el) : ""),
    () => (CONTENT_NAME_ROLES.has(role) ? textExcludingControls(el) : ""),
    () => tableCaption(el),
    () => el.getAttribute("placeholder") ?? "",
    () => el.getAttribute("title") ?? "",
  ];
  for (const candidate of candidates) {
    const name = collapse(candidate());
    if (name) return name;
  }
  return "";
}

export function isSensitive(el: Element): boolean {
  if (el.hasAttribute("data-sensitive")) return true;
  if (!isInput(el)) return false;
  return el.type === "password" || SENSITIVE_AUTOCOMPLETE.test(el.getAttribute("autocomplete") ?? "");
}

function booleanAttribute(el: Element, attribute: string): boolean | undefined {
  const raw = el.getAttribute(attribute);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

export function optionLabel(option: HTMLOptionElement): string {
  return collapse(option.label || option.textContent || option.value);
}

function selectOptions(el: HTMLSelectElement): string[] {
  return Array.from(el.options).map(optionLabel);
}

function valueOf(el: Element): string | undefined {
  if (el.tagName === "SELECT") {
    const select = el as HTMLSelectElement;
    const selected = Array.from(select.options).find((option) => option.value === select.value);
    return selected ? optionLabel(selected) : collapse(select.value);
  }
  if (el.tagName === "TEXTAREA" || isInput(el)) return collapse((el as HTMLInputElement).value);
  return undefined;
}

function checkedOf(el: Element, role: string): boolean | undefined {
  if (isInput(el) && (role === "checkbox" || role === "radio" || role === "switch")) return el.checked;
  return booleanAttribute(el, "aria-checked");
}

export function isDisabled(el: Element) {
  return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
}

export function tableBodyRows(table: Element): Element[] {
  return Array.from(table.querySelectorAll("tr")).filter((row) => row.querySelector("td"));
}

function tableSummary(el: Element): Pick<SnapshotElement, "columns" | "rows"> {
  const headerCells = Array.from(el.querySelectorAll("thead th, tr:first-child th"));
  const columns = headerCells.map((cell) => collapse(cell.textContent));
  return { columns, rows: tableBodyRows(el).length };
}

function withoutEmpty<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== "")) as T;
}

function describe(el: Element, role: string, ref: string, within: string | undefined): SnapshotElement {
  const sensitive = isSensitive(el);
  const base: SnapshotElement = {
    ref,
    role,
    name: accessibleName(el, role),
    within,
    href: el.tagName === "A" ? (el.getAttribute("href") ?? undefined) : undefined,
    value: sensitive ? undefined : valueOf(el),
    options: el.tagName === "SELECT" ? selectOptions(el as HTMLSelectElement) : undefined,
    checked: checkedOf(el, role),
    pressed: booleanAttribute(el, "aria-pressed"),
    expanded: booleanAttribute(el, "aria-expanded"),
    selected: booleanAttribute(el, "aria-selected"),
    disabled: isDisabled(el) || undefined,
    sensitive: sensitive || undefined,
    ...(role === "table" ? tableSummary(el) : {}),
  };
  return withoutEmpty(base);
}

type Walk = {
  elements: SnapshotElement[];
  refs: Map<string, Element>;
  unnamed: number;
  truncated: boolean;
};

function nextRef(walk: Walk, role: string) {
  return `${REF_LETTERS[role] ?? "e"}${walk.elements.length + 1}`;
}

function isLargeTable(el: Element, role: string) {
  return role === "table" && tableBodyRows(el).length > SMALL_TABLE_ROWS;
}

function visit(el: Element, within: string | undefined, walk: Walk) {
  if (walk.truncated || isHidden(el)) return;
  const role = roleOf(el);
  const recordable = role && !SCOPE_ONLY_ROLES.has(role) ? role : null;
  const scope = recordable ? (record(el, recordable, within, walk) ?? within) : within;
  if (walk.truncated || (recordable && isLargeTable(el, recordable))) return;
  for (const child of Array.from(el.children)) visit(child, scope, walk);
}

function record(el: Element, role: string, within: string | undefined, walk: Walk): string | undefined {
  const element = describe(el, role, nextRef(walk, role), within);
  if (!element.name && INTERACTIVE_ROLES.has(role)) {
    walk.unnamed += 1;
    return undefined;
  }
  if (walk.elements.length >= SNAPSHOT_ELEMENT_LIMIT) {
    walk.truncated = true;
    return undefined;
  }
  walk.elements.push(element);
  walk.refs.set(element.ref, el);
  return SCOPING_ROLES.has(role) ? element.ref : undefined;
}

export function currentPage(doc: Document = document): PageInfo {
  return { path: doc.location ? pagePath(doc.location) : "/", title: collapse(doc.title) };
}

function documentOf(root: ParentNode): Document {
  return root.ownerDocument ?? (root as Document);
}

export function snapshot(root: ParentNode, page: PageInfo = currentPage(documentOf(root))): SnapshotCapture {
  const walk: Walk = { elements: [], refs: new Map(), unnamed: 0, truncated: false };
  const start = root instanceof Element ? [root] : Array.from(root.children);
  for (const el of start) visit(el, undefined, walk);
  const result: Snapshot = { path: page.path, title: page.title, elements: walk.elements, unnamed: walk.unnamed };
  if (walk.truncated) result.truncated = true;
  return { snapshot: result, refs: walk.refs };
}

export type PageLink = { href: string; name: string };

/** Every visible in-app link on the page, including those inside tables the snapshot summarises; feeds the route index. */
export function collectLinks(root: ParentNode): PageLink[] {
  return Array.from(root.querySelectorAll("a[href]"))
    .filter((link) => !isHidden(link) && !isInsideIgnored(link))
    .map((link) => ({ href: link.getAttribute("href") ?? "", name: accessibleName(link, "link") }))
    .filter((link) => routePath(link.href) !== null);
}
