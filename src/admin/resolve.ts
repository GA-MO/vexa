import { failure, type AdminErrorCode } from "./errors";
import type { Target, TargetQuery } from "./schema";
import { accessibleName, collapse, isDisabled, isHidden, roleOf, SCOPING_ROLES, type SnapshotCapture } from "./snapshot";

export type Candidate = { ref?: string; name: string; within?: string };

export type Resolved =
  | { ok: true; element: Element }
  | { ok: false; error: AdminErrorCode; detail?: string; candidates?: Candidate[] };

export type Resolver = {
  remember(capture: SnapshotCapture): void;
  resolve(target: Target, root: ParentNode): Resolved;
};

type Remembered = { element: Element; role: string; name: string };

export const CANDIDATE_LIMIT = 5;

const CANDIDATE_SCOPE_ROLES = new Set(["row", "group", "form", "dialog", "alertdialog"]);

const REGEX_NAME = /^\/(.+)\/(i?)$/;

function nameMatcher(name: string): (candidate: string) => boolean {
  const regex = REGEX_NAME.exec(name);
  if (regex) {
    const pattern = new RegExp(regex[1], regex[2]);
    return (candidate) => pattern.test(candidate);
  }
  const wanted = collapse(name).toLowerCase();
  return (candidate) => candidate.toLowerCase() === wanted;
}

function describeTarget(target: Target) {
  if (typeof target === "string") return target;
  return `${target.role} "${target.name}"`;
}

function isInsideHidden(el: Element, root: ParentNode): boolean {
  let current: Element | null = el;
  while (current && current !== root) {
    if (isHidden(current)) return true;
    current = current.parentElement;
  }
  return false;
}

function matchingElements(root: ParentNode, query: TargetQuery): Element[] {
  const matches = nameMatcher(query.name);
  return Array.from(root.querySelectorAll("*")).filter((el) => {
    const role = roleOf(el);
    if (role !== query.role) return false;
    if (isInsideHidden(el, root)) return false;
    return matches(accessibleName(el, role));
  });
}

function unnamedElementsOfRole(root: ParentNode, role: string): Element[] {
  return Array.from(root.querySelectorAll("*")).filter((el) => roleOf(el) === role && !isInsideHidden(el, root) && !accessibleName(el, role));
}

function onlyUnnamedScope(root: ParentNode, query: TargetQuery): Element | null {
  if (!SCOPING_ROLES.has(query.role)) return null;
  const unnamed = unnamedElementsOfRole(root, query.role);
  return unnamed.length === 1 ? unnamed[0] : null;
}

function nearestScopeName(el: Element, root: ParentNode): string | undefined {
  let current = el.parentElement;
  while (current && current !== root) {
    const role = roleOf(current);
    if (role && CANDIDATE_SCOPE_ROLES.has(role)) return accessibleName(current, role) || undefined;
    current = current.parentElement;
  }
  return undefined;
}

function refOf(el: Element, refs: Map<string, Remembered>): string | undefined {
  for (const [ref, remembered] of refs) if (remembered.element === el) return ref;
  return undefined;
}

function rememberAll(capture: SnapshotCapture): Map<string, Remembered> {
  const refs = new Map<string, Remembered>();
  for (const [ref, element] of capture.refs) {
    const role = roleOf(element) ?? "";
    refs.set(ref, { element, role, name: collapse(accessibleName(element, role)) });
  }
  return refs;
}

function describeRemembered(remembered: Remembered) {
  return `"${remembered.name}" (${remembered.role})`;
}

function changedSince(remembered: Remembered): string | null {
  const role = roleOf(remembered.element) ?? "";
  const name = collapse(accessibleName(remembered.element, role));
  if (role === remembered.role && name === remembered.name) return null;
  return `now "${name}" (${role})`;
}

function candidatesFor(elements: Element[], root: ParentNode, refs: Map<string, Remembered>): Candidate[] {
  return elements.slice(0, CANDIDATE_LIMIT).map((el) => {
    const role = roleOf(el) ?? "";
    const candidate: Candidate = { name: accessibleName(el, role) };
    const ref = refOf(el, refs);
    if (ref) candidate.ref = ref;
    const within = nearestScopeName(el, root);
    if (within) candidate.within = within;
    return candidate;
  });
}

type Located = { ok: true; element: Element } | Resolved;

function interactable(located: Located): Resolved {
  if (!located.ok) return located;
  if (isDisabled(located.element)) return failure("ELEMENT_NOT_INTERACTABLE", "disabled");
  return located;
}

export function createResolver(): Resolver {
  let refs = new Map<string, Remembered>();

  function locateRef(ref: string): Located {
    const remembered = refs.get(ref);
    if (!remembered) return failure("TARGET_NOT_FOUND", `no element with ref ${ref} in the latest snapshot`);
    if (!remembered.element.isConnected) return failure("TARGET_STALE", `ref ${ref} is no longer on the page`);
    const changed = changedSince(remembered);
    if (changed) return failure("TARGET_STALE", `ref ${ref} was ${describeRemembered(remembered)}, ${changed}`);
    return { ok: true, element: remembered.element };
  }

  function refNamedInQuery(query: TargetQuery): string | null {
    const remembered = refs.get(query.name);
    return remembered && remembered.role === query.role ? query.name : null;
  }

  function locateQuery(query: TargetQuery, root: ParentNode): Located {
    const refAsName = refNamedInQuery(query);
    if (refAsName) return locateRef(refAsName);
    const scope = query.within === undefined ? { ok: true as const, element: root } : locate(query.within, root);
    if (!scope.ok) return scope;
    const found = matchingElements(scope.element, query);
    if (found.length === 0) {
      const fallback = onlyUnnamedScope(scope.element, query);
      return fallback ? { ok: true, element: fallback } : failure("TARGET_NOT_FOUND", `no ${describeTarget(query)} on the page`);
    }
    if (query.nth !== undefined) {
      const picked = found[query.nth];
      return picked ? { ok: true, element: picked } : failure("TARGET_NOT_FOUND", `only ${found.length} match ${describeTarget(query)}`);
    }
    if (found.length > 1) {
      return { ...failure("TARGET_AMBIGUOUS", `${found.length} match ${describeTarget(query)}`), candidates: candidatesFor(found, root, refs) };
    }
    return { ok: true, element: found[0] };
  }

  function locate(target: Target, root: ParentNode): Located {
    return typeof target === "string" ? locateRef(target) : locateQuery(target, root);
  }

  return {
    remember(capture) {
      refs = rememberAll(capture);
    },
    resolve(target, root) {
      return interactable(locate(target, root));
    },
  };
}
