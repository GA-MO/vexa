import { generateText, type LanguageModel } from "ai";
import { z } from "zod";

export const JUDGE_SCORE_MAX = 6;

const scoreSchema = z.object({ answers: z.number().int().min(0).max(2), fit: z.number().int().min(0).max(2), concise: z.number().int().min(0).max(2) });

export type JudgeScore = z.infer<typeof scoreSchema>;

const RUBRIC = [
  "You grade one reply of an admin assistant. Return only JSON: {\"answers\":0-2,\"fit\":0-2,\"concise\":0-2}.",
  "answers: 2 = the reply gives what the user asked for with the right data, 1 = partly, 0 = not at all or claims without showing.",
  "fit: 2 = the UI kind matches the request (a table for a list, a chart for a comparison, a form for input, a card for one record, no UI when none is needed), 1 = usable but a poor fit, 0 = wrong kind or missing when needed.",
  "concise: 2 = only what is needed, 1 = some padding or duplicate elements, 0 = bloated (many unrelated elements, repeated data, long text next to the UI).",
].join("\n");

const JSON_OBJECT = /\{[\s\S]*\}/;

function parseScore(text: string): JudgeScore | null {
  const match = JSON_OBJECT.exec(text);
  if (!match) return null;
  try {
    const parsed = scoreSchema.safeParse(JSON.parse(match[0]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type JudgeInput = { prompt: string; text: string; specTree: string };

const ATTEMPTS = 2;

/** Scores a reply on the fixed rubric with the same model, no tools; null when the judge never returned valid JSON. */
export async function judgeReply(model: LanguageModel, input: JudgeInput, providerOptions?: Record<string, Record<string, unknown>>): Promise<JudgeScore | null> {
  const prompt = [`User asked: ${input.prompt}`, "", `Assistant text: ${input.text || "(none)"}`, "", "Assistant UI (component tree):", input.specTree].join("\n");
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const { text } = await generateText({ model, system: RUBRIC, prompt, ...(providerOptions ? { providerOptions: providerOptions as never } : {}) });
      const score = parseScore(text);
      if (score) return score;
    } catch {
      if (attempt === ATTEMPTS) return null;
    }
  }
  return null;
}

export function judgeTotal(score: JudgeScore): number {
  return score.answers + score.fit + score.concise;
}
