import { afterEach, describe, expect, test } from "bun:test";
import { confirmationDialogsIn, insideConfirmationDialog, isConfirmationDialog } from "./dialogs";

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

function first(root: ParentNode, selector: string): Element {
  const found = root.querySelector(selector);
  if (!found) throw new Error(`no element for ${selector}`);
  return found;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isConfirmationDialog", () => {
  test("an alertdialog with Cancel and Delete is a confirmation", () => {
    const root = mount('<div role="alertdialog" aria-label="Delete kettle?"><p>Sure?</p><button>Cancel</button><button>Delete</button></div>');
    expect(isConfirmationDialog(first(root, "[role=alertdialog]"))).toBe(true);
  });

  test("a buttons-only dialog is a confirmation", () => {
    const root = mount('<div role="dialog" aria-label="Publish?"><button>Not now</button><button>Publish</button></div>');
    expect(isConfirmationDialog(first(root, "[role=dialog]"))).toBe(true);
  });

  test("an open native dialog with one close button is a confirmation", () => {
    const root = mount('<dialog open aria-label="Saved"><p>Saved.</p><button>OK</button></dialog>');
    expect(isConfirmationDialog(first(root, "dialog"))).toBe(true);
  });

  test("a dialog with an input is a form, not a confirmation", () => {
    const root = mount('<div role="dialog" aria-label="Rename"><label>Name<input /></label><button>Cancel</button><button>Save</button></div>');
    expect(isConfirmationDialog(first(root, "[role=dialog]"))).toBe(false);
  });

  test("a dialog with a custom combobox is a form, not a confirmation", () => {
    const root = mount('<div role="dialog" aria-label="Move"><div role="combobox" aria-label="Folder">Inbox</div><button>Move</button></div>');
    expect(isConfirmationDialog(first(root, "[role=dialog]"))).toBe(false);
  });

  test("five buttons is a menu, not a confirmation", () => {
    const root = mount('<div role="dialog" aria-label="Actions"><button>A</button><button>B</button><button>C</button><button>D</button><button>E</button></div>');
    expect(isConfirmationDialog(first(root, "[role=dialog]"))).toBe(false);
  });

  test("a hidden input does not count as an input", () => {
    const root = mount('<div role="alertdialog" aria-label="Archive?"><input type="hidden" name="id" value="1" /><button>Cancel</button><button>Archive</button></div>');
    expect(isConfirmationDialog(first(root, "[role=alertdialog]"))).toBe(true);
  });

  test("a hidden dialog and a closed native dialog are not confirmations", () => {
    const root = mount('<div role="alertdialog" hidden><button>OK</button></div><dialog aria-label="Closed"><button>OK</button></dialog>');
    expect(isConfirmationDialog(first(root, "[role=alertdialog]"))).toBe(false);
    expect(isConfirmationDialog(first(root, "dialog"))).toBe(false);
  });
});

describe("confirmationDialogsIn and insideConfirmationDialog", () => {
  test("lists only confirmation dialogs and finds the one a button sits in", () => {
    const root = mount(
      '<div role="dialog" aria-label="Rename"><input /><button>Save</button></div><div role="alertdialog" aria-label="Delete?"><button>Cancel</button><button id="yes">Delete</button></div><button id="outside">Delete product</button>',
    );
    const dialogs = confirmationDialogsIn(root);
    expect(dialogs.map((dialog) => dialog.getAttribute("aria-label"))).toEqual(["Delete?"]);
    expect(insideConfirmationDialog(first(root, "#yes"))).toBe(dialogs[0]);
    expect(insideConfirmationDialog(first(root, "#outside"))).toBeNull();
    expect(insideConfirmationDialog(first(root, "[role=dialog] button"))).toBeNull();
  });
  test("an alertdialog is a confirmation even when it asks to type a word", () => {
    const root = mount('<div role="alertdialog" aria-label="Delete?"><input aria-label="Type DELETE" /><button>Cancel</button><button>Delete</button></div>');
    expect(isConfirmationDialog(root.firstElementChild as Element)).toBe(true);
  });

});
