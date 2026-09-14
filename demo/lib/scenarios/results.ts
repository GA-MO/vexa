import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ScenarioResult, ScenarioResultsFile } from "./types";

const RESULTS_FILE = ".scenario-results.json";

export async function readScenarioResults(): Promise<ScenarioResultsFile | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), RESULTS_FILE), "utf8");
    return JSON.parse(raw) as ScenarioResultsFile;
  } catch {
    return null;
  }
}

export async function readScenarioResult(id: string): Promise<ScenarioResult | null> {
  const file = await readScenarioResults();
  return file?.results[id] ?? null;
}
