"use client";

import type { PackageStatRow } from "@/lib/amirant-course/vocabulary/parse-vocab-package-table";
import { cn } from "@/lib/design-system/cn";
import { VocabularyStatCard } from "./VocabularyStatCard";

export type VocabularyPackageOverviewProps = {
  rows: PackageStatRow[];
  /** When the preamble has no pipe table */
  fallback?: { wordCount: number };
  className?: string;
};

/**
 * Package structure as stat cards (replaces raw markdown tables).
 */
export function VocabularyPackageOverview({ rows, fallback, className }: VocabularyPackageOverviewProps) {
  if (rows.length > 0) {
    return (
      <div
        className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4", className)}
        role="list"
        aria-label="מבנה החבילה"
      >
        {rows.map((r, i) => (
          <div key={i} role="listitem">
            <VocabularyStatCard label={r.label} value={r.value} note={r.note} />
          </div>
        ))}
      </div>
    );
  }
  if (fallback) {
    return (
      <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
        <VocabularyStatCard label="מילים בשיעור" value={String(fallback.wordCount)} />
      </div>
    );
  }
  return null;
}
