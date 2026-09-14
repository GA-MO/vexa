import type { Scenario } from "./types";
import { scenario as chatElements } from "@/lib/test-plans/chat-elements";
import { scenario as smoke } from "@/lib/test-plans/smoke";
import { scenario as driverSmoke } from "@/lib/test-plans/driver-smoke";
import { scenario as navigate } from "@/lib/test-plans/navigate";
import { scenario as deepLink } from "@/lib/test-plans/deep-link";
import { scenario as pageState } from "@/lib/test-plans/page-state";
import { scenario as context } from "@/lib/test-plans/context";
import { scenario as buttonRunTool } from "@/lib/test-plans/button-runtool";
import { scenario as watchRunTool } from "@/lib/test-plans/watch-runtool";
import { scenario as serverRunTool } from "@/lib/test-plans/server-runtool";
import { scenario as formSubmit } from "@/lib/test-plans/form-submit";
import { scenario as hostToChat } from "@/lib/test-plans/host-to-chat";
import { scenario as approval } from "@/lib/test-plans/approval";
import { scenario as denialSemantics } from "@/lib/test-plans/denial-semantics";
import { scenario as serverTools } from "@/lib/test-plans/server-tools";
import { scenario as mcpStdio } from "@/lib/test-plans/mcp-stdio";
import { scenario as injection } from "@/lib/test-plans/injection";
import { scenario as registry } from "@/lib/test-plans/registry";
import { scenario as themeFormat } from "@/lib/test-plans/theme-format";
import { scenario as boundInputs } from "@/lib/test-plans/bound-inputs";
import { scenario as validation } from "@/lib/test-plans/validation";
import { scenario as conditionalUi } from "@/lib/test-plans/conditional-ui";
import { scenario as inputToModel } from "@/lib/test-plans/input-to-model";
import { scenario as multiStep } from "@/lib/test-plans/multi-step";
import { scenario as patchAfterInput } from "@/lib/test-plans/patch-after-input";
import { scenario as narrowPanel } from "@/lib/test-plans/narrow-panel";
import { scenario as keyboard } from "@/lib/test-plans/keyboard";

export const SCENARIOS: Scenario[] = [
  chatElements,
  smoke,
  driverSmoke,
  navigate,
  deepLink,
  pageState,
  context,
  buttonRunTool,
  watchRunTool,
  serverRunTool,
  formSubmit,
  hostToChat,
  approval,
  denialSemantics,
  serverTools,
  mcpStdio,
  injection,
  registry,
  themeFormat,
  boundInputs,
  validation,
  conditionalUi,
  inputToModel,
  multiStep,
  patchAfterInput,
  narrowPanel,
  keyboard,
];

export function findScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

export * from "./types";
