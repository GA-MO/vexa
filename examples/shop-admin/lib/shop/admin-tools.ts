import { adminToolDescriptors } from "vexa/admin";
import type { HostToolDescriptor } from "vexa/react";

/** The descriptors the shop-admin provider sends for admin_observe and admin_run, so scenarios and the runner share one definition with the app. */
export function adminHostToolDescriptors(): HostToolDescriptor[] {
  return adminToolDescriptors();
}
