import type { VocabularyItem, VocabularyProgress } from "@/types";

export interface VocabularyFilter {
  level?: string;
  topic?: string;
  /** Chỉ lấy nhóm từ: mới / yếu / yêu thích / tất cả. */
  scope?: "all" | "new" | "weak" | "favorite";
}

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
): VocabularyItem[] {
  return items.filter((item) => {
    if (filter.level && item.level !== filter.level) return false;
    if (filter.topic && item.topic !== filter.topic) return false;

    const progress = progressMap.get(item.id);
    switch (filter.scope) {
      case "new":
        return !progress || progress.state === "new";
      case "weak":
        return Boolean(progress?.markedWeak);
      case "favorite":
        return Boolean(progress?.favorite);
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
