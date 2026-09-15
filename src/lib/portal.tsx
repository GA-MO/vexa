"use client";

import { createContext, useContext, type RefObject } from "react";

export type PortalContainerRef = RefObject<HTMLElement | null>;

/** Popups portal into the VexaProvider theme element so they inherit its tokens and dark mode; outside a provider they fall back to `<body>`. */
export const PortalContainerContext = createContext<PortalContainerRef | null>(null);

export function usePortalContainer(): PortalContainerRef | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}
