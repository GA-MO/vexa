import { failure, type AdminFailure } from "./errors";
import { accessibleName, collapse, isDisabled, isHidden, optionLabel, tableBodyRows } from "./snapshot";

export type ActionResult = { ok: true; summary: string; data?: unknown } | AdminFailure;

export type TableData = { columns: string[]; rows: string[][]; truncated?: boolean };

export const TABLE_ROW_LIMIT = 50;
export const TABLE_COLUMN_LIMIT = 12;
const CELL_LIMIT = 80;
export const LISTBOX_TIMEOUT_MS = 1000;
const LISTBOX_POLL_MS = 25;

type ValueElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function bubble(el: Element, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

function setNativeValue(el: ValueElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el) as object, "value")?.set;
  if (!setter) return false;
  setter.call(el, value);
  return true;
}

const POINTER_SEQUENCE = ["pointerdown", "mousedown", "pointerup", "mouseup"] as const;

function pointerEvent(el: Element, type: string): Event {
  const view = el.ownerDocument.defaultView;
  const PointerCtor = view?.PointerEvent ?? view?.MouseEvent;
  const init = { bubbles: true, cancelable: true, composed: true, button: 0, buttons: type.endsWith("down") ? 1 : 0 };
  return PointerCtor ? new PointerCtor(type, init) : new Event(type, init);
}

function pressLikePointer(el: Element) {
  for (const type of POINTER_SEQUENCE) el.dispatchEvent(pointerEvent(el, type));
  (el as HTMLElement).click();
}

function isTextField(el: Element): el is HTMLInputElement | HTMLTextAreaElement {
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName !== "INPUT") return false;
  const type = (el as HTMLInputElement).type;
  return !["checkbox", "radio", "button", "submit", "reset", "file", "hidden", "image"].includes(type);
}

function normalize(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function focusable(el: Element): el is HTMLElement {
  return "focus" in el && typeof (el as HTMLElement).focus === "function";
}

export function fill(el: Element, value: string): ActionResult {
  if (!isTextField(el)) return failure("NOT_SUPPORTED", `${el.tagName.toLowerCase()} is not a text field`);
  if (isDisabled(el) || el.readOnly) return failure("ELEMENT_NOT_INTERACTABLE", "disabled or read-only");
  el.focus();
  if (!setNativeValue(el, value)) return failure("NOT_SUPPORTED", "no native value setter");
  bubble(el, "input");
  bubble(el, "change");
  el.blur();
  return { ok: true, summary: `Filled with "${value}"` };
}

function findOption(select: HTMLSelectElement, value: string): HTMLOptionElement | undefined {
  const wanted = normalize(value);
  const options = Array.from(select.options);
  return options.find((option) => normalize(option.value) === wanted) ?? options.find((option) => normalize(optionLabel(option)) === wanted);
}

function selectNative(select: HTMLSelectElement, value: string): ActionResult {
  if (isDisabled(select)) return failure("ELEMENT_NOT_INTERACTABLE", "disabled");
  const option = findOption(select, value);
  if (!option) return failure("OPTION_NOT_FOUND", `options: ${Array.from(select.options).map(optionLabel).join(", ")}`);
  select.focus();
  setNativeValue(select, option.value);
  bubble(select, "input");
  bubble(select, "change");
  select.blur();
  return { ok: true, summary: `Selected "${optionLabel(option)}"` };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function pollUntil<T>(probe: () => T | null, timeoutMs: number): Promise<T | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = probe();
    if (found) return found;
    await delay(LISTBOX_POLL_MS);
  }
  return probe();
}

function visibleListboxes(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>('[role="listbox"]')).filter((listbox) => !isHidden(listbox));
}

function listboxFor(combobox: Element): HTMLElement | null {
  const doc = combobox.ownerDocument;
  const controlled = combobox.getAttribute("aria-controls");
  const referenced = controlled ? doc.getElementById(controlled) : null;
  if (referenced && !isHidden(referenced)) return referenced;
  return visibleListboxes(doc)[0] ?? null;
}

function optionsOf(listbox: Element): HTMLElement[] {
  return Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
}

function optionNamed(listbox: Element, value: string): HTMLElement | undefined {
  const wanted = normalize(value);
  return optionsOf(listbox).find((option) => normalize(accessibleName(option, "option")) === wanted);
}

function listboxClosed(combobox: Element, listbox: Element) {
  return !listbox.isConnected || isHidden(listbox) || combobox.getAttribute("aria-expanded") === "false";
}

async function selectCustom(combobox: Element, value: string): Promise<ActionResult> {
  if (isDisabled(combobox)) return failure("ELEMENT_NOT_INTERACTABLE", "disabled");
  pressLikePointer(combobox);
  const listbox = await pollUntil(() => listboxFor(combobox), LISTBOX_TIMEOUT_MS);
  if (!listbox) return failure("ELEMENT_NOT_INTERACTABLE", "no listbox");
  const option = optionNamed(listbox, value);
  if (!option) {
    const names = optionsOf(listbox).map((item) => collapse(accessibleName(item, "option")));
    return failure("OPTION_NOT_FOUND", `options: ${names.join(", ")}`);
  }
  const label = collapse(accessibleName(option, "option"));
  pressLikePointer(option);
  await pollUntil(() => (listboxClosed(combobox, listbox) ? true : null), LISTBOX_TIMEOUT_MS);
  return { ok: true, summary: `Selected "${label}"` };
}

export async function select(el: Element, value: string): Promise<ActionResult> {
  if (el.tagName === "SELECT") return selectNative(el as HTMLSelectElement, value);
  if (el.getAttribute("role") === "combobox") return selectCustom(el, value);
  return failure("NOT_SUPPORTED", `${el.tagName.toLowerCase()} is not a select`);
}

function currentChecked(el: Element): boolean | null {
  if (el.tagName === "INPUT") return (el as HTMLInputElement).checked;
  const aria = el.getAttribute("aria-checked");
  return aria === null ? null : aria === "true";
}

export function check(el: Element, checked: boolean): ActionResult {
  const current = currentChecked(el);
  if (current === null) return failure("NOT_SUPPORTED", "element has no checked state");
  if (isDisabled(el)) return failure("ELEMENT_NOT_INTERACTABLE", "disabled");
  if (current === checked) return { ok: true, summary: checked ? "Already checked" : "Already unchecked" };
  (el as HTMLElement).click();
  return { ok: true, summary: checked ? "Checked" : "Unchecked" };
}

/** Presses like a pointer would: down and up events before the click, because some widgets (MUI Select) open on mousedown, not click. */
export function click(el: Element): ActionResult {
  if (isDisabled(el)) return failure("ELEMENT_NOT_INTERACTABLE", "disabled");
  if (!focusable(el)) return failure("NOT_SUPPORTED", "element cannot be clicked");
  el.focus();
  pressLikePointer(el);
  return { ok: true, summary: "Clicked" };
}

function formOf(el: Element): HTMLFormElement | null {
  if (el.tagName === "FORM") return el as HTMLFormElement;
  const owned = (el as HTMLButtonElement).form;
  return owned ?? el.closest("form");
}

function firstInvalidField(form: HTMLFormElement): string {
  const invalid = Array.from(form.elements).find((field) => "checkValidity" in field && !(field as HTMLInputElement).checkValidity());
  if (!invalid) return "unknown field";
  const input = invalid as HTMLInputElement;
  return input.name || input.id || input.getAttribute("aria-label") || input.tagName.toLowerCase();
}

export function submit(el: Element): ActionResult {
  const form = formOf(el);
  if (!form) return el.tagName === "BUTTON" ? click(el) : failure("NOT_SUPPORTED", "no form to submit");
  if (!form.checkValidity()) return failure("FORM_INVALID", firstInvalidField(form));
  const submitter = el !== form && el.tagName === "BUTTON" ? (el as HTMLButtonElement) : undefined;
  form.requestSubmit(submitter);
  return { ok: true, summary: "Submitted" };
}

function cellText(cell: Element) {
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, CELL_LIMIT);
}

export function readTable(el: Element): ActionResult {
  if (el.tagName !== "TABLE") return failure("NOT_SUPPORTED", `${el.tagName.toLowerCase()} is not a table`);
  const columns = Array.from(el.querySelectorAll("thead th, tr:first-child th")).map(cellText).slice(0, TABLE_COLUMN_LIMIT);
  const bodyRows = tableBodyRows(el);
  const rows = bodyRows.slice(0, TABLE_ROW_LIMIT).map((row) => Array.from(row.querySelectorAll("td")).map(cellText).slice(0, TABLE_COLUMN_LIMIT));
  const data: TableData = { columns, rows };
  if (bodyRows.length > TABLE_ROW_LIMIT) data.truncated = true;
  return { ok: true, summary: `Read ${rows.length} of ${bodyRows.length} rows`, data };
}
