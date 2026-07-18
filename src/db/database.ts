import Dexie, { type Table } from "dexie";
import type {
  VocabularyProgress,
  LearningSessionRecord,
  DailyStat,
  StoredSetting,
  BackupMetadata,
} from "@/types";

export class LangPawDatabase extends Dexie {
  progress!: Table<VocabularyProgress, string>;
  sessions!: Table<LearningSessionRecord, string>;
  dailyStats!: Table<DailyStat, string>;
  settings!: Table<StoredSetting, string>;
  backups!: Table<BackupMetadata, string>;

  constructor() {
    super("LangPawDatabase");
    this.registerSchema();
  }

  private registerSchema(): void {
    // Version 1 — xem src/db/migrations.ts để biết lịch sử schema.
    this.version(1).stores({
      progress: "vocabularyId, state, nextReviewAt, favorite, markedWeak",
      sessions: "id, language, startedAt, completed",
      dailyStats: "[date+language], date",
      settings: "key",
      backups: "id, createdAt",
    });
  }
}

let dbInstance: LangPawDatabase | null = null;
let dbUnavailable = false;

/**
 * Trả về instance database, hoặc null nếu IndexedDB không khả dụng.
 * Không bao giờ throw để ứng dụng không crash (yêu cầu §19.3).
 */
export function getDatabase(): LangPawDatabase | null {
  if (dbUnavailable) return null;
  if (dbInstance) return dbInstance;
  try {
    if (typeof indexedDB === "undefined") {
      dbUnavailable = true;
      return null;
    }
    dbInstance = new LangPawDatabase();
    return dbInstance;
  } catch (error) {
    console.error("Không khởi tạo được IndexedDB:", error);
    dbUnavailable = true;
    return null;
  }
}

export function isDatabaseAvailable(): boolean {
  return getDatabase() !== null;
}
