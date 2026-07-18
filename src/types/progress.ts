import type { LanguageCode } from "./vocabulary";

export type LearningState = "new" | "learning" | "review" | "mastered";

export interface VocabularyProgress {
  vocabularyId: string;
  state: LearningState;

  firstSeenAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;

  correctCount: number;
  incorrectCount: number;
  streak: number;
  lapseCount: number;

  easeFactor: number;
  intervalDays: number;
  repetition: number;

  favorite: boolean;
  markedWeak: boolean;
}

export interface LearningSessionRecord {
  id: string;
  language: LanguageCode;
  filters: Record<string, unknown>;
  vocabularyIds: string[];
  currentIndex: number;
  startedAt: string;
  finishedAt?: string;
  correct: number;
  incorrect: number;
  skipped: number;
  completed: boolean;
}

export interface DailyStat {
  /** Khóa dạng YYYY-MM-DD (theo local day). */
  date: string;
  language: LanguageCode | "all";
  wordsStudied: number;
  wordsLearned: number;
  reviewsDone: number;
  correct: number;
  incorrect: number;
  studyMs: number;
}

export interface StoredSetting {
  key: string;
  value: unknown;
}

export interface BackupMetadata {
  id: string;
  createdAt: string;
  note?: string;
}
