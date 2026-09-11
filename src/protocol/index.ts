import {
  SPEC_DATA_PART,
  SPEC_DATA_PART_TYPE,
  type Spec,
  type SpecDataPart,
  type UIElement,
} from "@json-render/core";
import type { UIMessage } from "ai";

export { SPEC_DATA_PART, SPEC_DATA_PART_TYPE };
export type { Spec, SpecDataPart, UIElement };

export type SpecElement = UIElement;

export type SpecPatchOp =
  | "add"
  | "remove"
  | "replace"
  | "move"
  | "copy"
  | "test";

export type SpecPatch = {
  op: SpecPatchOp;
  path: string;
  value?: unknown;
  from?: string;
};

export type AgenticDataParts = {
  [SPEC_DATA_PART]: SpecDataPart;
};

export type AgenticMessage = UIMessage<unknown, AgenticDataParts>;

export const COMPONENT_TYPES = [
  "Stack",
  "Card",
  "Grid",
  "Heading",
  "Text",
  "Metric",
  "Badge",
  "Alert",
  "Separator",
  "Table",
  "List",
  "Button",
  "Chart",
  "Image",
  "Tabs",
  "Progress",
  "Timeline",
  "Input",
  "Form",
  "Avatar",
  "Code",
  "Map",
  "Carousel",
  "Callout",
  "Accordion",
  "Video",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];
