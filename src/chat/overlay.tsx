"use client";

import { useEffect, useId, useState } from "react";
import { MessageCircleIcon, XIcon } from "lucide-react";
import { cn } from "agentic-ui/lib/utils";
import { AgenticChat, type AgenticChatProps } from "./agentic-chat";

export type AgenticChatOverlayProps = Omit<AgenticChatProps, "layout" | "onClose"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  launcherLabel?: string;
  position?: "bottom-right" | "bottom-left";
};

export function AgenticChatOverlay({
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  launcherLabel = "Open assistant",
  position = "bottom-right",
  className,
  ...chatProps
}: AgenticChatOverlayProps) {
  const titleId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
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

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={cn(
          "pointer-events-auto absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

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
            {chatProps.title ?? "Agentic UI"}
          </span>
          <AgenticChat
            {...chatProps}
            className={cn("h-full min-h-0", className)}
            layout="panel"
            onClose={() => setOpen(false)}
          />
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close assistant" : launcherLabel}
          onClick={() => setOpen(!open)}
          className={cn(
            "pointer-events-auto group relative inline-flex size-14 items-center justify-center rounded-full text-primary-foreground transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "bg-gradient-to-br from-primary to-brand-violet shadow-[0_16px_40px_-12px_rgba(79,70,229,0.7)]",
            "hover:scale-[1.04] active:scale-[0.98]",
          )}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-brand-violet opacity-60 blur-md transition group-hover:opacity-80"
          />
          <span className="relative">
            {open ? (
              <XIcon className="size-5" />
            ) : (
              <MessageCircleIcon className="size-5" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
