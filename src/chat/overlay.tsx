"use client";

import { useEffect, useId, useState } from "react";
import { MessageCircleIcon, XIcon } from "lucide-react";
import { cn } from "vexa/lib/utils";
import { useVexaHostContext } from "vexa/react";
import { isVexaFrame } from "vexa/admin";
import { VexaChat, type VexaChatProps } from "./vexa-chat";
import { DEFAULT_LABELS } from "./constants";

type OpenStateProps =
  | { open: boolean; onOpenChange: (open: boolean) => void; defaultOpen?: undefined }
  | { open?: undefined; onOpenChange?: (open: boolean) => void; defaultOpen?: boolean };

export type VexaChatOverlayProps = Omit<VexaChatProps, "layout" | "onClose"> &
  OpenStateProps & {
    launcherIcon?: React.ReactNode;
    launcherLabel?: string;
    position?: "bottom-right" | "bottom-left";
    /** `true` (default) dims the page and closes the panel on an outside click; `false` leaves the page usable while the chat is open. */
    backdrop?: boolean;
  };

function useInDiscoveryFrame(): boolean {
  const [inFrame, setInFrame] = useState(false);
  useEffect(() => {
    if (isVexaFrame()) setInFrame(true);
  }, []);
  return inFrame;
}

export function VexaChatOverlay({
  defaultOpen: defaultOpenProp,
  open: openProp,
  onOpenChange,
  launcherLabel: launcherLabelProp,
  launcherIcon: launcherIconProp,
  position: positionProp,
  backdrop: backdropProp,
  className,
  ...chatProps
}: VexaChatOverlayProps) {
  const host = useVexaHostContext();
  const defaultOpen = defaultOpenProp ?? host?.chat.defaultOpen ?? false;
  const labels = { ...DEFAULT_LABELS, ...host?.chat.labels, ...chatProps.labels };
  const launcherLabel = launcherLabelProp ?? host?.chat.launcherLabel ?? labels.openAssistant;
  const position = positionProp ?? host?.chat.position ?? "bottom-right";
  const backdrop = backdropProp ?? host?.chat.backdrop ?? true;
  const launcherIcon = launcherIconProp ?? host?.chat.launcherIcon ?? <MessageCircleIcon className="size-5" />;
  const titleId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const inDiscoveryFrame = useInDiscoveryFrame();
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const side = position === "bottom-left" ? "left-4 sm:left-6" : "right-4 sm:right-6";

  if (inDiscoveryFrame) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50" data-vexa-ignore="">
      {backdrop ? (
        <button
          type="button"
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            "pointer-events-auto absolute inset-0 bg-foreground/20 backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute bottom-4 flex flex-col items-end gap-3 sm:bottom-6",
          side,
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-hidden={!open}
          className={cn(
            "pointer-events-auto flex h-[min(42rem,calc(100dvh-6.5rem))] w-[min(100vw-2rem,26.5rem)] origin-bottom flex-col transition-all duration-300 ease-out",
            position === "bottom-left" ? "origin-bottom-left" : "origin-bottom-right",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-3 scale-[0.96] opacity-0",
          )}
        >
          <span id={titleId} className="sr-only">
            {chatProps.title ?? host?.chat.title ?? "Vexa"}
          </span>
          <VexaChat
            {...chatProps}
            className={cn("h-full min-h-0", className)}
            layout="panel"
            onClose={() => setOpen(false)}
          />
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? labels.closeAssistant : launcherLabel}
          onClick={() => setOpen(!open)}
          className={cn(
            "pointer-events-auto group relative inline-flex size-14 items-center justify-center rounded-full text-primary-foreground transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "bg-gradient-to-br from-primary to-brand-violet shadow-[0_16px_40px_-12px_var(--vexa-glow-strong)]",
            "hover:scale-[1.04] active:scale-[0.98]",
          )}
        >
          <span
            aria-hidden
            className="vexa-glow absolute inset-0 rounded-full bg-gradient-to-br from-primary to-brand-violet opacity-60 blur-md transition group-hover:opacity-80"
          />
          <span className="relative">
            {open ? <XIcon className="size-5" /> : launcherIcon}
          </span>
        </button>
      </div>
    </div>
  );
}
