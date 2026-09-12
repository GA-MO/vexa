import { nestedToFlat, type Spec } from "@json-render/core";

export type SpecTree = Parameters<typeof nestedToFlat>[0];

export function specFromTree(tree: SpecTree): Spec {
  return nestedToFlat(tree);
}

export function interactiveSpec(tree: SpecTree, state: Record<string, unknown>): Spec {
  return { ...specFromTree(tree), state };
}
