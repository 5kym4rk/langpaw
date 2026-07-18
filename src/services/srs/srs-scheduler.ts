import type { VocabularyProgress, LearningState } from "@/types";
import { REVIEW_GRADES, type ReviewGrade } from "@/config/learning";

const MIN_EASE = 1.3;
const LAPSE_MINUTES = 10;
const MASTERED_INTERVAL_DAYS = 30;
const MASTERED_MIN_ACCURACY = 0.85;

const GRADE_MULTIPLIER: Record<ReviewGrade, number> = {
  forgot: 1,
  hard: 0.8,
  normal: 1,
  easy: 1.3,
};

function updateEase(currentEase: number, quality: number): number {
  const nextEase =
    currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(MIN_EASE, nextEase);
}

function accuracy(p: VocabularyProgress): number {
  const total = p.correctCount + p.incorrectCount;
  return total === 0 ? 0 : p.correctCount / total;
}

function deriveState(
  intervalDays: number,
  acc: number,
  fallback: LearningState,
): LearningState {
  if (intervalDays >= MASTERED_INTERVAL_DAYS && acc >= MASTERED_MIN_ACCURACY) {
    return "mastered";
  }
  if (intervalDays >= 1) return "review";
  return fallback;
}

export interface ScheduleResult {
  progress: VocabularyProgress;
  /** Khoảng cách tới lần ôn tiếp theo (phút), để hiển thị/kiểm thử. */
  nextReviewInMinutes: number;
}

/**
 * Cập nhật tiến độ theo một biến thể SM-2 đơn giản (§13). Pure function:
 * truyền `now` để test thời gian ổn định, không phụ thuộc timezone.
 */
export function schedule(
  prev: VocabularyProgress,
  grade: ReviewGrade,
  now: Date,
): ScheduleResult {
  const quality = REVIEW_GRADES[grade];
  const nowMs = now.getTime();

  // Cập nhật đếm đúng/sai chung.
  const base: VocabularyProgress = {
    ...prev,
    firstSeenAt: prev.firstSeenAt ?? now.toISOString(),
    lastReviewedAt: now.toISOString(),
    correctCount: prev.correctCount + (quality >= 3 ? 1 : 0),
    incorrectCount: prev.incorrectCount + (quality < 3 ? 1 : 0),
    streak: quality >= 3 ? prev.streak + 1 : 0,
    easeFactor: updateEase(prev.easeFactor, quality),
  };

  if (quality < 3) {
    // Quên: đặt lại lịch, ôn lại sau 10 phút.
    const nextReviewAt = new Date(nowMs + LAPSE_MINUTES * 60_000);
    return {
      progress: {
        ...base,
        repetition: 0,
        intervalDays: 0,
        lapseCount: prev.lapseCount + 1,
        state: "learning",
        nextReviewAt: nextReviewAt.toISOString(),
      },
      nextReviewInMinutes: LAPSE_MINUTES,
    };
  }

  const repetition = prev.repetition + 1;
  let baseInterval: number;
  if (repetition === 1) {
    baseInterval = 1;
  } else if (repetition === 2) {
    baseInterval = 3;
  } else {
    baseInterval = Math.round(prev.intervalDays * base.easeFactor);
  }

  const intervalDays = Math.max(
    1,
    Math.round(baseInterval * GRADE_MULTIPLIER[grade]),
  );

  const nextReviewAt = new Date(nowMs + intervalDays * 24 * 60 * 60_000);
  const acc = accuracy(base);

  return {
    progress: {
      ...base,
      repetition,
      intervalDays,
      state: deriveState(intervalDays, acc, "review"),
      nextReviewAt: nextReviewAt.toISOString(),
    },
    nextReviewInMinutes: intervalDays * 24 * 60,
  };
}

export interface GradePreview {
  grade: ReviewGrade;
  intervalDays: number;
  /** Nhãn thời gian tiếng Việt, ví dụ "10 phút", "1 ngày". */
  label: string;
}

function humanize(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} phút`;
  const days = Math.round(minutes / (24 * 60));
  if (days < 1) return `${Math.round(minutes / 60)} giờ`;
  return `${days} ngày`;
}

/**
 * Tính trước lịch ôn cho cả bốn mức, để hiển thị trên nút (§9.6).
 * Không thay đổi tiến độ.
 */
export function previewGrades(
  prev: VocabularyProgress,
  now: Date,
): GradePreview[] {
  return (Object.keys(REVIEW_GRADES) as ReviewGrade[]).map((grade) => {
    const result = schedule(prev, grade, now);
    return {
      grade,
      intervalDays: result.progress.intervalDays,
      label: humanize(result.nextReviewInMinutes),
    };
  });
}
