import type { ReviewStatus, VocabularyItem } from "@/types";

export interface QualitySummary {
  total: number;
  draft: number;
  reviewed: number;
  verified: number;
  verifiedPct: number;
  missingExample: number;
  missingReading: number;
  missingSourceEntry: number;
}

function hasReading(item: VocabularyItem): boolean {
  return Boolean(item.reading || item.romanization || item.ipa);
}

/**
 * Tính báo cáo chất lượng dữ liệu cho một danh sách mục từ vựng. Pure function.
 */
export function computeQuality(items: VocabularyItem[]): QualitySummary {
  const counts: Record<ReviewStatus, number> = {
    draft: 0,
    reviewed: 0,
    verified: 0,
  };
  let missingExample = 0;
  let missingReading = 0;
  let missingSourceEntry = 0;

  for (const item of items) {
    counts[item.reviewStatus] += 1;
    if (!item.example || !item.exampleVi) missingExample += 1;
    if (!hasReading(item)) missingReading += 1;
    if (!item.sourceEntryUrl && !item.sourceEntryId) missingSourceEntry += 1;
  }

  const total = items.length;
  return {
    total,
    draft: counts.draft,
    reviewed: counts.reviewed,
    verified: counts.verified,
    verifiedPct: total > 0 ? Math.round((counts.verified / total) * 100) : 0,
    missingExample,
    missingReading,
    missingSourceEntry,
  };
}
