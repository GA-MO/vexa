import { afterEach, describe, expect, test } from "bun:test";
import { createResolver } from "./resolve";
import { snapshot } from "./snapshot";

const PAGE = { path: "/test", title: "Test" };

function mount(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

function resolverFor(html: string) {
  const root = mount(html);
  const capture = snapshot(root, PAGE);
  const resolver = createResolver();
  resolver.remember(capture);
  return { root, resolver, capture };
}

const ORDERS_TABLE = `
  <table>
    <thead><tr><th>Order</th><th>Customer</th><th></th></tr></thead>
    <tbody>
      <tr><td>C-1042</td><td>Jane</td><td><button>Edit</button><button disabled>Archive</button></td></tr>
      <tr><td>C-1043</td><td>Ken</td><td><button>Edit</button></td></tr>
      <tr><td>C-1044</td><td>Mia</td><td><button>Edit</button></td></tr>
      <tr><td>C-1045</td><td>Lee</td><td><button>Edit</button></td></tr>
      <tr><td>C-1046</td><td>Ana</td><td><button>Edit</button></td></tr>
      <tr><td>C-1047</td><td>Bob</td><td><button>Edit</button></td></tr>
    </tbody>
  </table>`;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("refs", () => {
  test("a known ref resolves to the live element", () => {
    const { root, resolver } = resolverFor("<button>Save</button>");
    const resolved = resolver.resolve("b1", root);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.element.textContent).toBe("Save");
  });

  test("an unknown ref is TARGET_NOT_FOUND", () => {
    const { root, resolver } = resolverFor("<button>Save</button>");
    expect(resolver.resolve("b9", root)).toMatchObject({ ok: false, error: "TARGET_NOT_FOUND" });
  });

  test("a ref whose element left the page is TARGET_STALE", () => {
    const { root, resolver, capture } = resolverFor("<button>Save</button>");
    capture.refs.get("b1")?.remove();
    expect(resolver.resolve("b1", root)).toMatchObject({ ok: false, error: "TARGET_STALE", detail: "ref b1 is no longer on the page" });
  });

  test("a ref whose element now has another name is TARGET_STALE, not a wrong click", () => {
    const { root, resolver, capture } = resolverFor("<button>Delete</button>");
    const button = capture.refs.get("b1") as HTMLElement;
    button.textContent = "Edit";
    expect(resolver.resolve("b1", root)).toMatchObject({ ok: false, error: "TARGET_STALE", detail: 'ref b1 was "Delete" (button), now "Edit" (button)' });
  });

  test("a ref still resolves after an unrelated re-render", () => {
    const { root, resolver, capture } = resolverFor("<button>Delete</button><p>x</p>");
    root.querySelector("p")?.remove();
    expect(resolver.resolve("b1", root)).toMatchObject({ ok: true, element: capture.refs.get("b1") });
  });
});

describe("role and name queries", () => {
  test("exact name, case-insensitive, whitespace collapsed", () => {
    const { root, resolver } = resolverFor("<button>  Create   product </button>");
    expect(resolver.resolve({ role: "button", name: "create PRODUCT" }, root).ok).toBe(true);
  });

  test("a /regex/ name", () => {
    const { root, resolver } = resolverFor('<a href="/orders/C-1042">C-1042</a>');
    expect(resolver.resolve({ role: "link", name: "/^c-10/i" }, root).ok).toBe(true);
    expect(resolver.resolve({ role: "link", name: "/^c-10/" }, root)).toMatchObject({ ok: false, error: "TARGET_NOT_FOUND" });
  });

  test("no match is TARGET_NOT_FOUND with the query in the detail", () => {
    const { root, resolver } = resolverFor("<button>Save</button>");
    expect(resolver.resolve({ role: "button", name: "Delete" }, root)).toMatchObject({
      ok: false,
      error: "TARGET_NOT_FOUND",
      detail: 'no button "Delete" on the page',
    });
  });

  test("several matches are TARGET_AMBIGUOUS with up to five candidates scoped by their row", () => {
    const { root, resolver } = resolverFor(ORDERS_TABLE);
    const resolved = resolver.resolve({ role: "button", name: "Edit" }, root);
    expect(resolved).toMatchObject({ ok: false, error: "TARGET_AMBIGUOUS", detail: '6 match button "Edit"' });
    if (resolved.ok) return;
    expect(resolved.candidates).toHaveLength(5);
    expect(resolved.candidates?.[0]).toEqual({ name: "Edit", within: "C-1042 Jane EditArchive" });
  });

  test("candidates carry the ref when the element is in the snapshot", () => {
    const { root, resolver } = resolverFor('<div role="group" aria-label="Actions"><button>Open</button></div><button>Open</button>');
    const resolved = resolver.resolve({ role: "button", name: "Open" }, root);
    if (resolved.ok) throw new Error("expected ambiguity");
    expect(resolved.candidates).toEqual([
      { ref: "b2", name: "Open", within: "Actions" },
      { ref: "b3", name: "Open" },
    ]);
  });

  test("nth picks one of several matches", () => {
    const { root, resolver } = resolverFor(ORDERS_TABLE);
    const resolved = resolver.resolve({ role: "button", name: "Edit", nth: 1 }, root);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.element.closest("tr")?.textContent).toContain("C-1043");
    expect(resolver.resolve({ role: "button", name: "Edit", nth: 9 }, root)).toMatchObject({ ok: false, error: "TARGET_NOT_FOUND" });
  });

  test("a disabled match is ELEMENT_NOT_INTERACTABLE", () => {
    const { root, resolver } = resolverFor(ORDERS_TABLE);
    expect(resolver.resolve({ role: "button", name: "Archive" }, root)).toMatchObject({ ok: false, error: "ELEMENT_NOT_INTERACTABLE" });
  });

  test("hidden matches are ignored", () => {
    const { root, resolver } = resolverFor('<div hidden><button>Save</button></div><button>Save</button>');
    expect(resolver.resolve({ role: "button", name: "Save" }, root).ok).toBe(true);
  });
});

describe("within", () => {
  test("scoping by a ref from the snapshot", () => {
    const { root, resolver, capture } = resolverFor('<div role="group" aria-label="Filters"><button>Reset</button></div><button>Reset</button>');
    const group = capture.snapshot.elements.find((el) => el.role === "group")!;
    const resolved = resolver.resolve({ role: "button", name: "Reset", within: group.ref }, root);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.element.parentElement?.getAttribute("aria-label")).toBe("Filters");
  });

  test("scoping by a row of a large table", () => {
    const { root, resolver } = resolverFor(ORDERS_TABLE);
    const resolved = resolver.resolve({ role: "button", name: "Edit", within: { role: "row", name: "/C-1044/" } }, root);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.element.closest("tr")?.textContent).toContain("Mia");
  });

  test("a scope that does not exist fails with its own error", () => {
    const { root, resolver } = resolverFor(ORDERS_TABLE);
    expect(resolver.resolve({ role: "button", name: "Edit", within: { role: "row", name: "/C-9999/" } }, root)).toMatchObject({
      ok: false,
      error: "TARGET_NOT_FOUND",
      detail: 'no row "/C-9999/" on the page',
    });
  });

  test("an ambiguous scope reports the scope, not the target", () => {
    const { root, resolver } = resolverFor(ORDERS_TABLE);
    expect(resolver.resolve({ role: "button", name: "Edit", within: { role: "row", name: "/C-104/" } }, root)).toMatchObject({
      ok: false,
      error: "TARGET_AMBIGUOUS",
      detail: '6 match row "/C-104/"',
    });
  });
});

describe("unnamed scopes", () => {
  test("a table without an accessible name matches a query for the only table on the page", () => {
    const root = mount('<h1>Products</h1><table><tr><th>Name</th></tr><tr><td><a href="/p/1">Kettle</a></td></tr></table>');
    const resolver = createResolver();
    const table = resolver.resolve({ role: "table", name: "Products" }, root);
    expect(table.ok).toBe(true);
    const link = resolver.resolve({ role: "link", name: "Kettle", within: { role: "table", name: "Products" } }, root);
    expect(link.ok && link.element.getAttribute("href")).toBe("/p/1");
  });

  test("two unnamed tables do not match by guess", () => {
    const root = mount("<table><tr><td>a</td></tr></table><table><tr><td>b</td></tr></table>");
    const result = createResolver().resolve({ role: "table", name: "Products" }, root);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe("TARGET_NOT_FOUND");
  });

  test("a named table is never matched under another name", () => {
    const root = mount('<table aria-label="Orders"><tr><td>a</td></tr></table>');
    const result = createResolver().resolve({ role: "table", name: "Products" }, root);
    expect(result.ok).toBe(false);
  });
  test("a query whose name is a remembered ref of the same role resolves to that ref", () => {
    const root = mount('<div role="alertdialog" aria-label="Delete kettle?"><button>Cancel</button><button>Delete</button></div>');
    const resolver = createResolver();
    resolver.remember(snapshot(root, { path: "/", title: "" }));
    const result = resolver.resolve({ role: "button", name: "Delete", within: { role: "alertdialog", name: "d1" } }, root);
    expect(result.ok).toBe(true);
    expect(result.ok && (result.element as HTMLElement).textContent).toBe("Delete");
    const wrongRole = resolver.resolve({ role: "button", name: "d1" }, root);
    expect(wrongRole.ok).toBe(false);
  });

});
