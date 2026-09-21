import { afterEach, describe, expect, test } from "bun:test";
import { click, select } from "./actions";

const OPTIONS = ["Beans", "Equipment", "Accessories"];

function mountCombobox(options: { opensListbox?: boolean } = {}): { combobox: HTMLButtonElement; value: () => string | null } {
  const root = document.createElement("div");
  root.innerHTML = '<label id="category-label">Category</label><button type="button" role="combobox" aria-labelledby="category-label" aria-expanded="false" aria-controls="category-list">Beans</button>';
  document.body.appendChild(root);
  const combobox = root.querySelector("button") as HTMLButtonElement;
  let value: string | null = null;
  combobox.addEventListener("click", () => {
    if (options.opensListbox === false) return;
    combobox.setAttribute("aria-expanded", "true");
    const listbox = document.createElement("div");
    listbox.id = "category-list";
    listbox.setAttribute("role", "listbox");
    for (const name of OPTIONS) {
      const option = document.createElement("div");
      option.setAttribute("role", "option");
      option.textContent = name;
      option.addEventListener("click", () => {
        value = name;
        combobox.setAttribute("aria-expanded", "false");
        listbox.remove();
      });
      listbox.appendChild(option);
    }
    document.body.appendChild(listbox);
  });
  return { combobox, value: () => value };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("select on a custom combobox", () => {
  test("opens the listbox, clicks the matching option and waits for it to close", async () => {
    const { combobox, value } = mountCombobox();
    const result = await select(combobox, "equipment");
    expect(result).toEqual({ ok: true, summary: 'Selected "Equipment"' });
    expect(value()).toBe("Equipment");
    expect(combobox.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });

  test("lists the options when none matches", async () => {
    const { combobox, value } = mountCombobox();
    const result = await select(combobox, "Tea");
    expect(result).toEqual({ ok: false, error: "OPTION_NOT_FOUND", detail: "options: Beans, Equipment, Accessories" });
    expect(value()).toBeNull();
  });

  test("reports no listbox when the popup never appears", async () => {
    const { combobox } = mountCombobox({ opensListbox: false });
    const result = await select(combobox, "Beans");
    expect(result).toEqual({ ok: false, error: "ELEMENT_NOT_INTERACTABLE", detail: "no listbox" });
  });
  test("click sends pointerdown and mousedown before the click, so a mousedown-opened widget opens", () => {
    const root = document.createElement("div");
    root.innerHTML = '<button id="trigger">Open</button>';
    document.body.appendChild(root);
    const trigger = root.querySelector<HTMLButtonElement>("#trigger");
    const seen: string[] = [];
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) trigger?.addEventListener(type, () => seen.push(type));
    expect(click(trigger as Element).ok).toBe(true);
    expect(seen).toEqual(["pointerdown", "mousedown", "pointerup", "mouseup", "click"]);
  });

});
