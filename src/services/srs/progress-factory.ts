import type { VocabularyProgress } from "@/types";

/** Tạo bản ghi tiến độ mặc định cho một từ chưa học. Pure function. */
export function createInitialProgress(
  vocabularyId: string,
): VocabularyProgress {
  return {
    vocabularyId,
    state: "new",
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    lapseCount: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    repetition: 0,
    favorite: false,
    markedWeak: false,
  };
}
