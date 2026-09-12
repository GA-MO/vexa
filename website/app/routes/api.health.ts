import type { Route } from "./+types/api.health";

export function loader(_args: Route.LoaderArgs) {
  return Response.json({ ok: true, service: "vexa-website", time: new Date().toISOString() });
}
