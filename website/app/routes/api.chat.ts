import type { Route } from "./+types/api.chat";
import { getChatModels, postChat } from "@/lib/chat.server";

export function loader(_args: Route.LoaderArgs) {
  return getChatModels();
}

export function action({ request }: Route.ActionArgs) {
  return postChat(request);
}
