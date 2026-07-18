import type { LanguageCode, VocabularyProgress } from "@/types";
import {
  getOrCreateProgress,
  saveProgress,
} from "@/db/repositories/progress-repository";
import { recordActivity } from "@/db/repositories/stats-repository";

export type PracticeActivity = "quiz" | "listening";

export interface PracticeResultInput {
  vocabularyId: string;
  language: LanguageCode;
  activityType: PracticeActivity;
  correct: boolean;
  /** Đánh dấu từ yếu khi trả lời sai. */
  markWeakOnWrong?: boolean;
  durationMs?: number;
  now?: Date;
}

/**
 * Cập nhật tiến độ sau một câu luyện tập (quiz/nghe). Pure function.
 * KHÔNG tự coi một câu đúng là "đã thuộc" (P1.1) và không đụng tới lịch SRS
 * (nextReviewAt) — việc đó thuộc về trang Ôn tập.
 */
export function applyPracticeToProgress(
  prev: VocabularyProgress,
  correct: boolean,
  now: Date,
  markWeakOnWrong = false,
): VocabularyProgress {
  return {
    ...prev,
    firstSeenAt: prev.firstSeenAt ?? now.toISOString(),
    lastReviewedAt: now.toISOString(),
    correctCount: prev.correctCount + (correct ? 1 : 0),
    incorrectCount: prev.incorrectCount + (correct ? 0 : 1),
    streak: correct ? prev.streak + 1 : 0,
    state: prev.state === "new" ? "learning" : prev.state,
    markedWeak: !correct && markWeakOnWrong ? true : prev.markedWeak,
  };
}

/**
 * Ghi kết quả một câu luyện tập: cập nhật VocabularyProgress và daily stats.
 * Trả về tiến độ đã cập nhật.
 */
export async function recordPracticeResult(
  input: PracticeResultInput,
): Promise<VocabularyProgress> {
  const now = input.now ?? new Date();
  const prev = await getOrCreateProgress(input.vocabularyId);
  const updated = applyPracticeToProgress(
    prev,
    input.correct,
    now,
    input.markWeakOnWrong,
  );
  await saveProgress(updated);
  await recordActivity(
    input.language,
    {
      wordsStudied: 1,
      correct: input.correct ? 1 : 0,
      incorrect: input.correct ? 0 : 1,
      studyMs: input.durationMs ?? 0,
    },
    now,
  );
  return updated;
}
