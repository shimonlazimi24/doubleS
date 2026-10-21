"use client";

import { useAmirantCourseAccess } from "./AmirantCourseAccessProvider";
import { AmirantCourseFloatingChat } from "./AmirantCourseFloatingChat";
import { getPrepShowCourseAssistant } from "@/lib/prep/prep-full-access";

/**
 * Shows the course assistant to learners with full access.
 *
 * The decision used to be made in the course layout on the server, which cost
 * every page under /course an auth call and an entitlement read before it could
 * start rendering. The access provider already resolves the same fact in the
 * browser, so the layout now renders at once and the assistant appears when the
 * provider answers. The chat route still enforces access on its own.
 */
export function AmirantCourseAssistantGate() {
  const { hasFullAccess } = useAmirantCourseAccess();
  if (!getPrepShowCourseAssistant() && !hasFullAccess) return null;
  return <AmirantCourseFloatingChat />;
}
