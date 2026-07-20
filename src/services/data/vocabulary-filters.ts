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
  /** Lộ trình: certificate = learningReady; dictionary = ngoài lộ trình. */
  route?: "certificate" | "dictionary";
  /** Lộ trình chủ đề: item phải có topicIds giao với danh sách này. */
  requiredTopicIds?: string[];
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
    if (filter.requiredTopicIds && filter.requiredTopicIds.length > 0) {
      // Lộ trình chủ đề (spec P1-VI): cần chủ đề khớp + nghĩa/cách đọc hợp lệ.
      if (item.invalidMeaning) return false;
      if (!item.topicIds?.some((t) => filter.requiredTopicIds!.includes(t)))
        return false;
      const needsReading =
        item.language === "zh" ||
        item.language === "ko" ||
        (item.language === "ja" && /[一-鿿]/.test(item.term));
      if (needsReading && !(item.reading || item.romanization)) return false;
    }
    if (filter.route === "certificate") {
      // Lộ trình chứng chỉ CHỈ nhận mục learningReady (spec P0-II): đã khớp
      // index + nghĩa hợp lệ + có cách đọc + không chờ rà soát.
      if (item.learningReady !== true) return false;
    } else if (filter.route === "dictionary") {
      // "Ngoài lộ trình": chưa phân cấp HOẶC chưa đủ điều kiện học.
      if (item.learningReady === true) return false;
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
