export const ADMIN_ERROR_CODES = [
  "TARGET_NOT_FOUND",
  "TARGET_AMBIGUOUS",
  "TARGET_STALE",
  "ELEMENT_NOT_INTERACTABLE",
  "OPTION_NOT_FOUND",
  "ROUTE_NOT_FOUND",
  "NAVIGATION_TIMEOUT",
  "SUBMIT_FAILED",
  "FORM_INVALID",
  "DECLINED",
  "ACTION_NOT_ALLOWED",
  "PLAN_INVALID",
  "NOT_SUPPORTED",
  "PAGE_NOT_OBSERVED",
  "DISCOVERY_UNAVAILABLE",
] as const;

export type AdminErrorCode = (typeof ADMIN_ERROR_CODES)[number];

export type AdminFailure = { ok: false; error: AdminErrorCode; detail?: string };

export function failure(error: AdminErrorCode, detail?: string): AdminFailure {
  return detail ? { ok: false, error, detail } : { ok: false, error };
}
