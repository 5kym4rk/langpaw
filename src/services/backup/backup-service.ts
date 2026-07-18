import type { UserSettings, VocabularyProgress, DailyStat } from "@/types";
import { backupSchema, type BackupInput } from "./backup-schema";
import {
  getAllProgress,
  clearAllProgress,
  bulkPutProgress,
} from "@/db/repositories/progress-repository";
import {
  getAllStats,
  clearAllStats,
  bulkPutStats,
} from "@/db/repositories/stats-repository";
import { localDateKey } from "@/utils/date";

export interface LangPawBackup {
  app: "LangPaw";
  schemaVersion: 1;
  exportedAt: string;
  settings: UserSettings;
  progress: VocabularyProgress[];
  dailyStats?: DailyStat[];
}

export type ImportMode = "merge" | "replace";

export type ParseResult =
  { ok: true; data: BackupInput } | { ok: false; error: string };

/** Thu thập toàn bộ dữ liệu hiện có thành một backup. */
export async function buildBackup(
  settings: UserSettings,
  now: Date = new Date(),
): Promise<LangPawBackup> {
  const [progress, dailyStats] = await Promise.all([
    getAllProgress(),
    getAllStats(),
  ]);
  return {
    app: "LangPaw",
    schemaVersion: 1,
    exportedAt: now.toISOString(),
    settings,
    progress,
    dailyStats,
  };
}

export function serializeBackup(backup: LangPawBackup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(now: Date = new Date()): string {
  return `langpaw-backup-${localDateKey(now)}.json`;
}

/** Phân tích và kiểm tra file backup bằng Zod. Pure function. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "File không phải JSON hợp lệ." };
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    if (
      typeof raw === "object" &&
      raw !== null &&
      "schemaVersion" in raw &&
      (raw as { schemaVersion: unknown }).schemaVersion !== 1
    ) {
      return {
        ok: false,
        error: "Phiên bản backup không được hỗ trợ.",
      };
    }
    return { ok: false, error: "Cấu trúc backup không hợp lệ." };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Hợp nhất hai danh sách tiến độ theo vocabularyId; bản nhập ghi đè bản hiện có.
 * Pure function.
 */
export function mergeProgressLists(
  existing: VocabularyProgress[],
  incoming: VocabularyProgress[],
): VocabularyProgress[] {
  const map = new Map(existing.map((p) => [p.vocabularyId, p]));
  for (const p of incoming) map.set(p.vocabularyId, p);
  return Array.from(map.values());
}

/** Áp dụng backup vào cơ sở dữ liệu theo chế độ hợp nhất hoặc thay thế. */
export async function applyBackup(
  data: BackupInput,
  mode: ImportMode,
): Promise<void> {
  const incomingProgress = data.progress as VocabularyProgress[];
  const incomingStats = (data.dailyStats ?? []) as DailyStat[];

  if (mode === "replace") {
    await clearAllProgress();
    await clearAllStats();
    await bulkPutProgress(incomingProgress);
    await bulkPutStats(incomingStats);
    return;
  }

  // merge
  const existing = await getAllProgress();
  await bulkPutProgress(mergeProgressLists(existing, incomingProgress));
  await bulkPutStats(incomingStats);
}

/** Tạo và tải file backup (chỉ chạy trong trình duyệt). */
export function downloadBackup(backup: LangPawBackup): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([serializeBackup(backup)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
