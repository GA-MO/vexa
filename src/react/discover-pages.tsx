"use client";

import { useState } from "react";
import { cn } from "./cn";
import { useVexaAdmin } from "./host";
import type { DiscoveryProgress } from "../admin/discover";

export type VexaDiscoverPagesProps = {
  skip?: (path: string) => boolean;
  limit?: number;
  className?: string;
};

const EXPORT_FILE_NAME = "vexa-pages.json";
const SAVE_NOTICE_MS = 2500;
const BUTTON_CLASS =
  "rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60";

type SaveNotice = "saved" | "up-to-date" | "failed" | null;

function discoverLabel(progress: DiscoveryProgress, observed: number, blocked: string | null) {
  if (progress.status === "running") return `Discovering… ${progress.current ?? ""} (${progress.visited.length} of ${progress.visited.length + progress.pending})`;
  if (blocked) return `Discovery unavailable: ${blocked}`;
  if (observed > 0) return `${observed} pages known`;
  return "Discover pages";
}

function saveLabel(notice: SaveNotice) {
  if (notice === "saved") return "Saved to file";
  if (notice === "up-to-date") return "Up to date";
  if (notice === "failed") return "Save failed";
  return "Save";
}

function downloadJson(fileName: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Developer control for the page cache: shows what discovery found, reruns it in the hidden frame on demand, then saves the pages file through the dev server (`pagesFile`) or downloads it. Renders nothing when `admin` is off. */
export function VexaDiscoverPages({ skip, limit, className }: VexaDiscoverPagesProps) {
  const { enabled, discover, progress, blocked, observed, exportPages, canSave, save } = useVexaAdmin();
  const [notice, setNotice] = useState<SaveNotice>(null);
  if (!enabled) return null;
  const running = progress.status === "running";
  const known = observed.length > 0 && !running;

  const saveNow = async () => {
    const result = await save();
    setNotice(result.ok ? (result.written ? "saved" : "up-to-date") : "failed");
    setTimeout(() => setNotice(null), SAVE_NOTICE_MS);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)} data-vexa-ignore="">
      <button
        type="button"
        onClick={() => void discover({ skip, limit })}
        disabled={running || blocked !== null}
        aria-busy={running}
        title={known ? "Rediscover" : undefined}
        className={BUTTON_CLASS}
      >
        {discoverLabel(progress, observed.length, blocked)}
      </button>
      {known && canSave ? (
        <button type="button" onClick={() => void saveNow()} className={BUTTON_CLASS}>
          {saveLabel(notice)}
        </button>
      ) : null}
      {known && !canSave ? (
        <button type="button" onClick={() => downloadJson(EXPORT_FILE_NAME, exportPages())} className={BUTTON_CLASS}>
          Export
        </button>
      ) : null}
    </div>
  );
}
