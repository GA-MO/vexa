import type { Route } from "./+types/api.assistant";
import { getAssistantModels, postAssistant } from "@/lib/assistant.server";

export function loader(_args: Route.LoaderArgs) {
  return getAssistantModels();
}

export function action({ request }: Route.ActionArgs) {
  return postAssistant(request);
}
