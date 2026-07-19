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
  missingSourceEntryUrl: number;
  missingSourceEntryId: number;
  missingReviewer: number;
  missingReviewedAt: number;
  selfAuthored: number;
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
  let missingSourceEntryUrl = 0;
  let missingSourceEntryId = 0;
  let missingReviewer = 0;
  let missingReviewedAt = 0;
  let selfAuthored = 0;

  for (const item of items) {
    counts[item.reviewStatus] += 1;
    if (!item.example || !item.exampleVi) missingExample += 1;
    if (!hasReading(item)) missingReading += 1;
    if (!item.sourceEntryUrl && !item.sourceEntryId) missingSourceEntry += 1;
    if (!item.sourceEntryUrl) missingSourceEntryUrl += 1;
    if (!item.sourceEntryId) missingSourceEntryId += 1;
    // Reviewer/ngày kiểm duyệt: chỉ tính với mục đã rà soát/kiểm duyệt.
    if (item.reviewStatus !== "draft") {
      if (!item.reviewedBy) missingReviewer += 1;
      if (!item.reviewedAt) missingReviewedAt += 1;
    }
    if (item.exampleSelfAuthored) selfAuthored += 1;
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
    missingSourceEntryUrl,
    missingSourceEntryId,
    missingReviewer,
    missingReviewedAt,
    selfAuthored,
  };
}

/** Xuất báo cáo chất lượng theo ngôn ngữ thành CSV (§10 — Export CSV). */
export function qualityToCsv(
  rows: { language: string; q: QualitySummary }[],
): string {
  const header = [
    "language",
    "total",
    "draft",
    "reviewed",
    "verified",
    "verifiedPct",
    "missingExample",
    "missingReading",
    "missingSourceEntry",
    "missingSourceEntryUrl",
    "missingSourceEntryId",
    "missingReviewer",
    "missingReviewedAt",
    "selfAuthored",
  ];
  const lines = rows.map(({ language, q }) =>
    [
      language,
      q.total,
      q.draft,
      q.reviewed,
      q.verified,
      q.verifiedPct,
      q.missingExample,
      q.missingReading,
      q.missingSourceEntry,
      q.missingSourceEntryUrl,
      q.missingSourceEntryId,
      q.missingReviewer,
      q.missingReviewedAt,
      q.selfAuthored,
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n") + "\n";
}
