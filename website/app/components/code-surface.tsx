import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import CODE_THEMES from "@/lib/code-themes.json";

export type CodeLanguage = "json" | "jsonl" | "tsx" | "ts" | "bash";

const SHIKI_LANGUAGE: Record<CodeLanguage, string> = {
  json: "json",
  jsonl: "json",
  tsx: "tsx",
  ts: "ts",
  bash: "bash",
};

/** A syntax-highlighted code block for code that is only known at runtime (specs, streams, generated snippets). */
export function CodeSurface({
  code,
  lang,
  title,
  className,
  viewportClassName,
}: {
  code: string;
  lang: CodeLanguage;
  title?: string;
  className?: string;
  viewportClassName?: string;
}) {
  return (
    <DynamicCodeBlock
      lang={SHIKI_LANGUAGE[lang]}
      code={code}
      options={{ themes: CODE_THEMES }}
      codeblock={{ title, className, viewportProps: { className: viewportClassName } }}
    />
  );
}
