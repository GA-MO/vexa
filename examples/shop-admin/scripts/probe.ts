import type { UIMessage } from "ai";
import { evaluateSpec } from "vexa/eval";
import { componentsOf, specOf, specTree } from "@/lib/eval-ui/reply";
import { evalShopTools, shopHostToolDescriptors } from "@/lib/eval-ui/shop-tools";
import { createDomPageHost } from "@/lib/scenarios/dom-host";
import { createHeadlessHost } from "@/lib/scenarios/driver";
import { BASE_URL, DEBUG, MODEL, lastAssistantMessage, sendUserMessage, type ChatSession } from "@/lib/scenarios/model-turn";
import { adminHostToolDescriptors } from "@/lib/shop/admin-tools";

const DEFAULT_RUNS = 1;
const DEFAULT_PAGE = "/";
const TEXT_PREVIEW = 400;

function parseArgs(argv: string[]) {
  const runs = Number(argv.find((arg) => arg.startsWith("--runs="))?.split("=")[1] ?? DEFAULT_RUNS);
  const page = argv.find((arg) => arg.startsWith("--page="))?.split("=")[1] ?? DEFAULT_PAGE;
  const adminOff = argv.includes("--no-admin");
  const prompt = argv.filter((arg) => !arg.startsWith("--")).join(" ").trim();
  if (!prompt) throw new Error('usage: bun run probe -- "prompt" [--page=/orders] [--runs=3] [--no-admin]   (VEXA_SCENARIO_MODEL picks the model)');
  return { prompt, page, runs, adminOff };
}

async function probeOnce(prompt: string, page: string, adminOn: boolean) {
  const domPage = await createDomPageHost(page, { passive: false });
  const tools = { ...evalShopTools(domPage), ...(adminOn ? domPage.tools : {}) };
  const hostTools = [...shopHostToolDescriptors(), ...(adminOn ? adminHostToolDescriptors() : [])];
  const host = createHeadlessHost({ tools, hostTools, context: { path: page } });
  const session: ChatSession = { chatId: crypto.randomUUID(), messages: [], host, seenToolCallIds: new Set(), request: { context: { path: page }, hostTools } };
  const started = Date.now();
  const turn = await sendUserMessage(session, prompt);
  await domPage.dispose();
  const message = lastAssistantMessage(session);
  return { turn, spec: specOf(message), parts: message?.parts ?? [], latencyMs: Date.now() - started };
}

function describePart(part: UIMessage["parts"][number]): string {
  if (part.type === "text") return `text (${part.text.length} chars): ${part.text.slice(0, 80).replace(/\n/g, " ")}`;
  if (part.type === "data-spec") return `data-spec ${JSON.stringify(part.data).slice(0, 160)}`;
  return part.type;
}

async function main() {
  const { prompt, page, runs, adminOff } = parseArgs(process.argv.slice(2));
  console.log(`probe: "${prompt}" from ${page}, ${runs} run(s), admin ${adminOff ? "off" : "on"}, ${BASE_URL}, ${MODEL}`);
  for (let run = 1; run <= runs; run += 1) {
    const { turn, spec, parts, latencyMs } = await probeOnce(prompt, page, !adminOff);
    const elementCount = spec ? Object.keys(spec.elements).length : 0;
    console.log(`\n== run ${run}: ${latencyMs} ms · tools [${turn.tools.join(", ")}] · text ${turn.text.length} chars · spec ${elementCount} elements · ${componentsOf(spec).join(", ") || "no UI"}`);
    if (turn.errors.length > 0) console.log(`errors: ${turn.errors.join("; ")}`);
    const issues = spec ? evaluateSpec(spec).issues : [];
    if (issues.length > 0) console.log(`spec issues: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
    if (DEBUG) console.log(`parts:\n${parts.map(describePart).join("\n")}`);
    console.log(`text: ${turn.text.length > TEXT_PREVIEW ? `${turn.text.slice(0, TEXT_PREVIEW)}…` : turn.text || "(none)"}`);
    console.log(specTree(spec));
  }
}

await main();
