import { isHidden, isInsideIgnored } from "./snapshot";

export const DIALOG_SELECTOR = '[role="alertdialog"], [role="dialog"], dialog[open]';
const INPUT_SELECTOR =
  'input:not([type="hidden"]), textarea, select, [role="textbox"], [role="searchbox"], [role="combobox"], [role="listbox"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="spinbutton"]';
const BUTTON_SELECTOR = 'button, [role="button"], a[href]';
const CONFIRMATION_BUTTON_LIMIT = 4;

function isDialog(el: Element): boolean {
  const role = el.getAttribute("role");
  if (role === "alertdialog" || role === "dialog") return true;
  return el.tagName === "DIALOG" && (el as HTMLDialogElement).open;
}

/** An alertdialog, or a dialog that only asks the user to decide: no inputs, one to four buttons or links. */
export function isConfirmationDialog(el: Element): boolean {
  if (!isDialog(el) || isHidden(el) || isInsideIgnored(el)) return false;
  if (el.getAttribute("role") === "alertdialog") return true;
  if (el.querySelector(INPUT_SELECTOR)) return false;
  const buttons = el.querySelectorAll(BUTTON_SELECTOR).length;
  return buttons > 0 && buttons <= CONFIRMATION_BUTTON_LIMIT;
}

export function confirmationDialogsIn(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll(DIALOG_SELECTOR)).filter(isConfirmationDialog);
}

export function insideConfirmationDialog(el: Element): Element | null {
  const dialog = el.closest(DIALOG_SELECTOR);
  return dialog && isConfirmationDialog(dialog) ? dialog : null;
}

export function newConfirmationDialog(root: ParentNode, before: Set<Element>): Element | null {
  return confirmationDialogsIn(root).find((dialog) => !before.has(dialog)) ?? null;
}
