import type { VocabularyItem, VocabularyProgress } from "@/types";

export interface ReviewCandidate {
  item: VocabularyItem;
  progress?: VocabularyProgress;
}

/**
 * Xây dựng hàng đợi ôn tập theo thứ tự ưu tiên (§9.6):
 * 1. Từ đã đến hạn (nextReviewAt <= now).
 * 2. Từ sai nhiều.
 * 3. Từ bị đánh dấu yếu.
 * 4. Từ lâu chưa gặp.
 * Pure function, truyền `now` để test ổn định.
 */
export function buildReviewQueue(
  items: VocabularyItem[],
  progressMap: Map<string, VocabularyProgress>,
  now: Date = new Date(),
): ReviewCandidate[] {
  const nowMs = now.getTime();

  const scored = items
    .map((item) => {
      const progress = progressMap.get(item.id);
      return { item, progress };
    })
    .filter(({ progress }) => {
      if (!progress) return false; // Chưa học thì không nằm trong hàng ôn.
      const due =
        progress.nextReviewAt !== undefined &&
        new Date(progress.nextReviewAt).getTime() <= nowMs;
      return due || progress.markedWeak || progress.incorrectCount > 0;
    });

  const priority = ({ progress }: ReviewCandidate): number => {
    if (!progress) return 0;
    let score = 0;
    if (
      progress.nextReviewAt &&
      new Date(progress.nextReviewAt).getTime() <= nowMs
    ) {
      score += 1000;
    }
    score += Math.min(progress.incorrectCount, 20) * 10;
    if (progress.markedWeak) score += 50;
    // Lâu chưa gặp: cộng theo số ngày kể từ lần ôn gần nhất.
    if (progress.lastReviewedAt) {
      const days =
        (nowMs - new Date(progress.lastReviewedAt).getTime()) /
        (24 * 60 * 60_000);
      score += Math.min(days, 60);
    }
    return score;
  };

  return scored.sort((a, b) => priority(b) - priority(a));
}
