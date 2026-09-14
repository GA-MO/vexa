import type { ReactNode } from "react";

/** Frames a live spec at the 340-600px chat width catalog components are designed for. */
export function ChatWidthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose w-full max-w-[600px] rounded-xl border border-border bg-card p-4">
      {children}
    </div>
  );
}
