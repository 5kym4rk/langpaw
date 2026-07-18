import { getDatabase } from "../database";
import type { VocabularyProgress } from "@/types";
import { createInitialProgress } from "@/services/srs/progress-factory";

/**
 * Repository truy cập bảng progress. Mọi truy cập IndexedDB đi qua đây,
 * không gọi Dexie trực tiếp trong component (yêu cầu §4.2).
 *
 * Khi IndexedDB không khả dụng, dùng bộ nhớ tạm trong phiên (Map) để không
 * crash — dữ liệu sẽ mất khi reload (yêu cầu §19.3).
 */
const memoryFallback = new Map<string, VocabularyProgress>();

export async function getProgress(
  vocabularyId: string,
): Promise<VocabularyProgress | undefined> {
  const db = getDatabase();
  if (!db) return memoryFallback.get(vocabularyId);
  return db.progress.get(vocabularyId);
}

export async function getAllProgress(): Promise<VocabularyProgress[]> {
  const db = getDatabase();
  if (!db) return Array.from(memoryFallback.values());
  return db.progress.toArray();
}

export async function getProgressMap(): Promise<
  Map<string, VocabularyProgress>
> {
  const all = await getAllProgress();
  return new Map(all.map((p) => [p.vocabularyId, p]));
}

export async function saveProgress(
  progress: VocabularyProgress,
): Promise<void> {
  const db = getDatabase();
  if (!db) {
    memoryFallback.set(progress.vocabularyId, progress);
    return;
  }
  await db.progress.put(progress);
}

/** Lấy tiến độ hiện có hoặc tạo mới (chưa lưu) nếu chưa tồn tại. */
export async function getOrCreateProgress(
  vocabularyId: string,
): Promise<VocabularyProgress> {
  const existing = await getProgress(vocabularyId);
  return existing ?? createInitialProgress(vocabularyId);
}

export async function clearAllProgress(): Promise<void> {
  memoryFallback.clear();
  const db = getDatabase();
  if (!db) return;
  await db.progress.clear();
}

export async function bulkPutProgress(
  list: VocabularyProgress[],
): Promise<void> {
  const db = getDatabase();
  if (!db) {
    for (const p of list) memoryFallback.set(p.vocabularyId, p);
    return;
  }
  await db.progress.bulkPut(list);
}
