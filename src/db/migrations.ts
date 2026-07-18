/**
 * Lịch sử schema IndexedDB.
 *
 * Version 1 (0.1.0):
 *   - progress: vocabularyId (PK), state, nextReviewAt, favorite, markedWeak
 *   - sessions: id (PK), language, startedAt, completed
 *   - dailyStats: [date+language] (PK compound), date
 *   - settings: key (PK)
 *   - backups: id (PK), createdAt
 *
 * Khi thêm version mới, khai báo tại LangPawDatabase.registerSchema() với
 * .version(n).stores({...}).upgrade(...) và KHÔNG xóa dữ liệu người dùng nếu
 * có thể migrate.
 */
export const CURRENT_DB_VERSION = 1;
