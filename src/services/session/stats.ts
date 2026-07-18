import type { VocabularyProgress } from "@/types";

export interface ProgressSummary {
  total: number;
  learned: number;
  due: number;
  weak: number;
  favorite: number;
}

/**
 * Tính tóm tắt tiến độ từ danh sách progress. Pure function, truyền `now` để
 * test ổn định (yêu cầu §13.4 về thời gian giả lập).
 */
export function summarizeProgress(
  progress: VocabularyProgress[],
  now: Date = new Date(),
): ProgressSummary {
  const nowMs = now.getTime();
  let learned = 0;
  let due = 0;
  let weak = 0;
  let favorite = 0;

  for (const p of progress) {
    if (p.state !== "new") learned += 1;
    if (p.markedWeak) weak += 1;
    if (p.favorite) favorite += 1;
    if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= nowMs) {
      due += 1;
    }
  }

  return { total: progress.length, learned, due, weak, favorite };
}
