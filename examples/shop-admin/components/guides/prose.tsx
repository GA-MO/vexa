import { Fragment } from "react";

const CODE_SPLIT = /(`[^`]+`)/;

/** Renders a sentence where backtick spans become inline code. */
export function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split(CODE_SPLIT).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function ControlPath({ segments }: { segments: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {segments.map((segment, index) => (
        <li key={index} className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
            <Prose text={segment} />
          </span>
          {index < segments.length - 1 ? (
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
