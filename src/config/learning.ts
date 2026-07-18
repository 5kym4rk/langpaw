export const DAILY_GOALS = [5, 10, 20, 30] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number];

export const DEFAULT_SPEECH = {
  rate: 0.95,
  pitch: 1,
  volume: 1,
  repeatCount: 1,
  pauseMs: 800,
} as const;

/** Bốn mức đánh giá SRS ánh xạ sang quality (SM-2). */
export const REVIEW_GRADES = {
  forgot: 0,
  hard: 3,
  normal: 4,
  easy: 5,
} as const;

export type ReviewGrade = keyof typeof REVIEW_GRADES;

export const REVIEW_GRADE_LABELS: Record<ReviewGrade, string> = {
  forgot: "Quên hoàn toàn",
  hard: "Khó",
  normal: "Bình thường",
  easy: "Dễ",
};
