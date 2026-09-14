"use client";

import { cn } from "vexa/lib/utils";
import { CheckIcon, CopyIcon, WrapTextIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Fragment, useEffect, useState } from "react";
import { vexaCode } from "./code-theme";

const COPIED_FEEDBACK_MS = 1600;

const HEADER_BUTTON =
  "inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

type HighlightedLines = NonNullable<ReturnType<typeof vexaCode.highlight>>["tokens"];

function useHighlightedLines(code: string, language: string) {
  const [lines, setLines] = useState<HighlightedLines | null>(null);

  useEffect(() => {
    if (!vexaCode.supportsLanguage(language as never)) {
      setLines(null);
      return;
    }
    let active = true;
    const themes = vexaCode.getThemes();
    const ready = vexaCode.highlight({ code, language: language as never, themes }, (result) => {
      if (active) setLines(result.tokens);
    });
    if (ready) setLines(ready.tokens);
    return () => {
      active = false;
    };
  }, [code, language]);

  return lines;
}

function HighlightedCode({ lines }: { lines: HighlightedLines }) {
  return (
    <>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {line.map((token, tokenIndex) => (
            <span key={tokenIndex} style={token.htmlStyle ?? (token.color ? { color: token.color } : undefined)}>
              {token.content}
            </span>
          ))}
          {lineIndex < lines.length - 1 ? "\n" : null}
        </Fragment>
      ))}
    </>
  );
}

export type CodeBlockCopyButtonProps = ComponentProps<"button"> & {
  code: string;
};

export function CodeBlockCopyButton({ code, className, ...props }: CodeBlockCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  return (
    <button
      aria-label={copied ? "Copied" : "Copy code"}
      className={cn(HEADER_BUTTON, className)}
      onClick={copy}
      type="button"
      {...props}
    >
      {copied ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5" />}
    </button>
  );
}

function WrapToggle({ wrapped, onToggle }: { wrapped: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label={wrapped ? "Scroll long lines" : "Wrap long lines"}
      aria-pressed={wrapped}
      className={cn(HEADER_BUTTON, wrapped && "bg-muted text-foreground")}
      onClick={onToggle}
      type="button"
    >
      <WrapTextIcon className="size-3.5" />
    </button>
  );
}

export type CodeBlockProps = ComponentProps<"div"> & {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
  wrap?: boolean;
};

export function CodeBlock({
  code,
  language = "text",
  title,
  showCopy = true,
  wrap = false,
  className,
  ...props
}: CodeBlockProps) {
  const showLanguage = title !== undefined && title !== language;
  const lines = useHighlightedLines(code, language);
  const [wrapped, setWrapped] = useState(wrap);
  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-md border border-border bg-muted/40 text-xs",
        className,
      )}
      data-language={language}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1">
        <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">{title ?? language}</span>
        <span className="flex shrink-0 items-center gap-2">
          {showLanguage ? <span className="font-mono text-[11px] text-muted-foreground/70">{language}</span> : null}
          <WrapToggle onToggle={() => setWrapped((value) => !value)} wrapped={wrapped} />
          {showCopy ? <CodeBlockCopyButton code={code} /> : null}
        </span>
      </div>
      <pre
        className={cn(
          "overflow-x-auto px-3 py-2 font-mono leading-relaxed text-foreground",
          wrapped && "whitespace-pre-wrap wrap-anywhere",
        )}
      >
        <code>{lines ? <HighlightedCode lines={lines} /> : code}</code>
      </pre>
    </div>
  );
}
