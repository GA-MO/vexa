import { afterEach, describe, expect, test } from "bun:test";
import { collectLinks, SNAPSHOT_ELEMENT_LIMIT, snapshot, type SnapshotElement } from "./snapshot";

const PAGE = { path: "/test", title: "Test" };

function mount(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

function elementsOf(html: string): SnapshotElement[] {
  return snapshot(mount(html), PAGE).snapshot.elements;
}

function only(html: string): SnapshotElement {
  const elements = elementsOf(html);
  expect(elements).toHaveLength(1);
  return elements[0];
}

function tableRows(count: number, withButton = false) {
  const rows = Array.from({ length: count }, (_, index) => `<tr><td>Row ${index + 1}</td><td>${withButton ? "<button>Edit</button>" : "x"}</td></tr>`).join("");
  return `<table><thead><tr><th>Name</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("accessible name precedence", () => {
  test("aria-labelledby wins over everything", () => {
    const el = only('<span id="lbl">From labelledby</span><input aria-labelledby="lbl" aria-label="From aria-label" placeholder="From placeholder" />');
    expect(el.name).toBe("From labelledby");
  });

  test("aria-label wins over label[for]", () => {
    const el = only('<label for="f">From label</label><input id="f" aria-label="From aria-label" />');
    expect(el.name).toBe("From aria-label");
  });

  test("label[for] wins over a wrapping label", () => {
    const el = only('<label for="f">From for</label><label>Wrapping<input id="f" /></label>');
    expect(el.name).toBe("From for");
  });

  test("wrapping label wins over content and placeholder", () => {
    const el = only('<label><span>Wrapping</span><input placeholder="From placeholder" /></label>');
    expect(el.name).toBe("Wrapping");
  });

  test("button content wins over title", () => {
    const el = only('<button title="From title"><svg aria-label="icon"></svg> Save</button>');
    expect(el.name).toBe("icon Save");
  });

  test("placeholder wins over title", () => {
    const el = only('<input placeholder="From placeholder" title="From title" />');
    expect(el.name).toBe("From placeholder");
  });

  test("title is the last resort", () => {
    const el = only('<input title="From title" />');
    expect(el.name).toBe("From title");
  });

  test("an unnamed interactive element is counted, not listed", () => {
    const { snapshot: page } = snapshot(mount("<button></button><input />"), PAGE);
    expect(page.elements).toHaveLength(0);
    expect(page.unnamed).toBe(2);
  });

  test("an unnamed structural element is listed without a name key", () => {
    const el = only("<form><span>no controls</span></form>");
    expect(el.role).toBe("form");
    expect("name" in el).toBe(false);
  });
});

describe("hidden elements", () => {
  test("hidden attribute, aria-hidden, display none, closed dialog and a hidden ancestor are skipped", () => {
    const elements = elementsOf(
      [
        "<button hidden>A</button>",
        '<button aria-hidden="true">B</button>',
        '<button style="display:none">C</button>',
        '<button style="visibility:hidden">D</button>',
        "<dialog><button>E</button></dialog>",
        '<div aria-hidden="true"><button>F</button></div>',
        "<button>Visible</button>",
      ].join(""),
    );
    expect(elements.map((el) => el.name)).toEqual(["Visible"]);
  });

  test("a display:contents wrapper that checkVisibility rejects is still walked", () => {
    const root = mount('<div style="display:contents"><button>Inside</button></div><button style="display:none">Gone</button>');
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("div, button"))) {
      el.checkVisibility = () => getComputedStyle(el).display !== "none" && getComputedStyle(el).display !== "contents";
    }
    const { snapshot: page } = snapshot(root, { path: "/", title: "" });
    expect(page.elements.map((el) => el.name)).toEqual(["Inside"]);
  });

  test("a data-vexa-ignore subtree is skipped, with its links and dialogs", () => {
    const root = mount(
      '<button>Keep</button><div data-vexa-ignore=""><a href="/chat">Chat</a><div role="dialog" aria-label="Assistant"><button>Close chat</button></div></div>',
    );
    const { snapshot: page } = snapshot(root, { path: "/", title: "" });
    expect(page.elements.map((el) => el.name)).toEqual(["Keep"]);
    expect(collectLinks(root)).toEqual([]);
  });

  test("an open dialog is listed with its buttons", () => {
    const elements = elementsOf('<dialog open aria-label="Confirm"><button>Yes</button></dialog>');
    expect(elements.map((el) => el.role)).toEqual(["dialog", "button"]);
    expect(elements[1].within).toBe(elements[0].ref);
  });
});

describe("sensitive values", () => {
  test("password, credential autocomplete and data-sensitive fields keep their value private", () => {
    const elements = elementsOf(
      [
        '<input aria-label="Password" type="password" value="hunter2" />',
        '<input aria-label="Card" autocomplete="cc-number" value="4111" />',
        '<input aria-label="Token" data-sensitive value="abc" />',
        '<input aria-label="Name" value="Jane" />',
      ].join(""),
    );
    expect(elements.map((el) => el.sensitive)).toEqual([true, true, true, undefined]);
    expect(elements.map((el) => el.value)).toEqual([undefined, undefined, undefined, "Jane"]);
  });

  test("hidden inputs are omitted", () => {
    const elements = elementsOf('<input type="hidden" name="csrf" value="x" /><input aria-label="Email" />');
    expect(elements.map((el) => el.name)).toEqual(["Email"]);
  });
});

describe("tables", () => {
  test("a large table is summarised and its descendants are not listed", () => {
    const elements = elementsOf(tableRows(6, true));
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({ role: "table", columns: ["Name", "Action"], rows: 6 });
  });

  test("a small table lists its interactive descendants", () => {
    const elements = elementsOf(tableRows(3, true));
    expect(elements.map((el) => el.role)).toEqual(["table", "button", "button", "button"]);
    expect(elements[1].within).toBe(elements[0].ref);
  });

  test("a caption names the table", () => {
    const [table] = elementsOf("<table><caption>Orders</caption><tr><th>Id</th></tr><tr><td>1</td></tr></table>");
    expect(table.name).toBe("Orders");
  });
});

describe("states and values", () => {
  test("select value and options, checkbox state, pressed and expanded attributes", () => {
    const elements = elementsOf(
      [
        '<label>Locale<select><option value="en">English</option><option value="de" selected>German</option></select></label>',
        '<label><input type="checkbox" checked />Active</label>',
        '<button aria-pressed="true">Dark</button>',
        '<button aria-expanded="false">Menu</button>',
        '<button disabled>Save</button>',
      ].join(""),
    );
    expect(elements[0]).toMatchObject({ role: "combobox", name: "Locale", value: "German", options: ["English", "German"] });
    expect(elements[1]).toMatchObject({ role: "checkbox", name: "Active", checked: true });
    expect(elements[2]).toMatchObject({ pressed: true });
    expect(elements[3]).toMatchObject({ expanded: false });
    expect(elements[4]).toMatchObject({ disabled: true });
  });

  test("links carry href and a scoping group", () => {
    const elements = elementsOf('<nav role="group" aria-label="Main"><a href="/orders">Orders</a></nav>');
    expect(elements[1]).toMatchObject({ role: "link", name: "Orders", href: "/orders", within: elements[0].ref });
  });
});

describe("refs and the cap", () => {
  test("refs are dense and prefixed by role", () => {
    const elements = elementsOf('<button>One</button><input /><a href="/x">Two</a>');
    expect(elements.map((el) => el.ref)).toEqual(["b1", "l2"]);
  });

  test("the snapshot stops at the element limit and says so", () => {
    const buttons = Array.from({ length: SNAPSHOT_ELEMENT_LIMIT + 5 }, (_, index) => `<button>B${index}</button>`).join("");
    const { snapshot: page, refs } = snapshot(mount(buttons), PAGE);
    expect(page.elements).toHaveLength(SNAPSHOT_ELEMENT_LIMIT);
    expect(page.truncated).toBe(true);
    expect(refs.size).toBe(SNAPSHOT_ELEMENT_LIMIT);
  });

  test("a ref points at the live element and knows when it left", () => {
    const container = mount("<button>Remove me</button>");
    const { refs } = snapshot(container, PAGE);
    const button = refs.get("b1");
    expect(button?.isConnected).toBe(true);
    button?.remove();
    expect(button?.isConnected).toBe(false);
  });
  test("menu, tree and grid cell roles are interactive elements with their own ref letters", () => {
    const elements = elementsOf(
      '<ul role="menu"><li role="menuitem">Orders</li><li role="menuitemcheckbox" aria-checked="false">Dense</li></ul><div role="tree"><div role="treeitem">Root</div></div><div role="grid"><div role="row"><div role="gridcell">A1</div></div></div>',
    );
    expect(elements.map((el) => [el.role, el.name, el.ref[0]])).toEqual([
      ["menuitem", "Orders", "m"],
      ["menuitemcheckbox", "Dense", "m"],
      ["treeitem", "Root", "v"],
      ["gridcell", "A1", "x"],
    ]);
  });

});
