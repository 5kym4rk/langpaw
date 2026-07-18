import { getDatabase } from "../database";
import type { DailyStat, LanguageCode } from "@/types";
import { localDateKey } from "@/utils/date";

const memoryFallback = new Map<string, DailyStat>();

function keyOf(date: string, language: LanguageCode | "all"): string {
  return `${date}|${language}`;
}

export interface ActivityDelta {
  wordsStudied?: number;
  wordsLearned?: number;
  reviewsDone?: number;
  correct?: number;
  incorrect?: number;
  studyMs?: number;
}

function emptyStat(date: string, language: LanguageCode | "all"): DailyStat {
  return {
    date,
    language,
    wordsStudied: 0,
    wordsLearned: 0,
    reviewsDone: 0,
    correct: 0,
    incorrect: 0,
    studyMs: 0,
  };
}

function merge(stat: DailyStat, delta: ActivityDelta): DailyStat {
  return {
    ...stat,
    wordsStudied: stat.wordsStudied + (delta.wordsStudied ?? 0),
    wordsLearned: stat.wordsLearned + (delta.wordsLearned ?? 0),
    reviewsDone: stat.reviewsDone + (delta.reviewsDone ?? 0),
    correct: stat.correct + (delta.correct ?? 0),
    incorrect: stat.incorrect + (delta.incorrect ?? 0),
    studyMs: stat.studyMs + (delta.studyMs ?? 0),
  };
}

/**
 * Ghi nhận hoạt động học hôm nay cho một ngôn ngữ. Cập nhật cả bản ghi ngôn
 * ngữ và bản ghi tổng ("all") cùng ngày.
 */
export async function recordActivity(
  language: LanguageCode,
  delta: ActivityDelta,
  now: Date = new Date(),
): Promise<void> {
  const date = localDateKey(now);
  const db = getDatabase();

  for (const lang of [language, "all"] as const) {
    if (!db) {
      const k = keyOf(date, lang);
      memoryFallback.set(
        k,
        merge(memoryFallback.get(k) ?? emptyStat(date, lang), delta),
      );
      continue;
    }
    const existing = await db.dailyStats.get([date, lang]);
    await db.dailyStats.put(merge(existing ?? emptyStat(date, lang), delta));
  }
}

export async function getAllStats(): Promise<DailyStat[]> {
  const db = getDatabase();
  if (!db) return Array.from(memoryFallback.values());
  return db.dailyStats.toArray();
}

export async function getStatsForLanguage(
  language: LanguageCode | "all",
): Promise<DailyStat[]> {
  const all = await getAllStats();
  return all.filter((s) => s.language === language);
}

export async function clearAllStats(): Promise<void> {
  memoryFallback.clear();
  const db = getDatabase();
  if (!db) return;
  await db.dailyStats.clear();
}

export async function bulkPutStats(list: DailyStat[]): Promise<void> {
  const db = getDatabase();
  if (!db) {
    for (const s of list) memoryFallback.set(keyOf(s.date, s.language), s);
    return;
  }
  await db.dailyStats.bulkPut(list);
}
