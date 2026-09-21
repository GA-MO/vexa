export const ADMIN_TOOL_PREFIX = "admin_";

export const ADMIN_TOOLS = { observe: "admin_observe", run: "admin_run", discover: "admin_discover" } as const;

export type AdminToolName = (typeof ADMIN_TOOLS)[keyof typeof ADMIN_TOOLS];

export function isAdminToolName(name: string): boolean {
  return name.startsWith(ADMIN_TOOL_PREFIX);
}
