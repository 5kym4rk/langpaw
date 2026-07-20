import type { ReviewStatus, VocabularyItem, VocabularyProgress } from "@/types";

/** Mức kiểm duyệt tối thiểu được phép hiển thị. */
export type ReviewLevel = "all" | "reviewed" | "verified";

export type VocabularyScope =
  "all" | "new" | "due" | "weak" | "favorite" | "learned";

export interface VocabularyFilter {
  level?: string;
  topic?: string;
  /** Nhóm từ: mới / đến hạn ôn / yếu / yêu thích / đã học / tất cả. */
  scope?: VocabularyScope;
  /** Lọc theo trạng thái kiểm duyệt tối thiểu (mặc định "all"). */
  reviewLevel?: ReviewLevel;
  /** Lộ trình: certificate = đã gán cấp chứng chỉ; dictionary = chưa phân loại. */
  route?: "certificate" | "dictionary";
}

const REVIEW_RANK: Record<ReviewStatus, number> = {
  draft: 0,
  reviewed: 1,
  verified: 2,
};

const REVIEW_LEVEL_MIN: Record<ReviewLevel, number> = {
  all: 0,
  reviewed: 1,
  verified: 2,
};

/** Kiểm tra một mục có đạt mức kiểm duyệt tối thiểu hay không. Pure. */
export function meetsReviewLevel(
  item: VocabularyItem,
  level: ReviewLevel = "all",
): boolean {
  return REVIEW_RANK[item.reviewStatus] >= REVIEW_LEVEL_MIN[level];
}

/** Lọc danh sách theo mức kiểm duyệt tối thiểu. Pure. */
export function filterByReviewLevel(
  items: VocabularyItem[],
  level: ReviewLevel = "all",
): VocabularyItem[] {
  return items.filter((item) => meetsReviewLevel(item, level));
}

export const REVIEW_LEVEL_LABELS: Record<ReviewLevel, string> = {
  all: "Gồm cả bản nháp",
  reviewed: "Đã rà soát trở lên",
  verified: "Chỉ nội dung đã xác minh",
};

export function uniqueLevels(items: VocabularyItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.level))).sort();
}

export function uniqueTopics(items: VocabularyItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.topic))).sort();
}

export function filterVocabulary(
  items: VocabularyItem[],
  filter: VocabularyFilter,
  progressMap: Map<string, VocabularyProgress>,
  nowMs: number = Date.now(),
): VocabularyItem[] {
  return items.filter((item) => {
    if (filter.route) {
      const certified =
        item.certificateStatus === "official" ||
        item.certificateStatus === "reference";
      if ((filter.route === "certificate") !== certified) return false;
    }
    if (filter.level && item.level !== filter.level) return false;
    if (filter.topic && item.topic !== filter.topic) return false;
    if (!meetsReviewLevel(item, filter.reviewLevel)) return false;

    const progress = progressMap.get(item.id);
    switch (filter.scope) {
      case "new":
        return !progress || progress.state === "new";
      case "due":
        return Boolean(
          progress?.nextReviewAt &&
          new Date(progress.nextReviewAt).getTime() <= nowMs,
        );
      case "weak":
        return Boolean(progress?.markedWeak);
      case "favorite":
        return Boolean(progress?.favorite);
      case "learned":
        return Boolean(progress && progress.state !== "new");
      default:
        return true;
    }
  });
}

/**
 * Xáo trộn Fisher–Yates với hàm random tiêm vào để test ổn định.
 * Không thay đổi mảng gốc.
 */
export function shuffle<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
