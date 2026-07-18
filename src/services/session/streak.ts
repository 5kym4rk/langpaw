import { localDateKey } from "@/utils/date";

/**
 * Tính chuỗi ngày học liên tiếp tính đến hôm nay. Pure function.
 * Streak vẫn đếm nếu hôm nay chưa học nhưng hôm qua có (chưa bị đứt).
 */
export function computeStreak(
  studiedDateKeys: Iterable<string>,
  today: Date = new Date(),
): number {
  const set = new Set(studiedDateKeys);
  if (set.size === 0) return 0;

  const todayKey = localDateKey(today);
  const cursor = new Date(today);

  // Nếu hôm nay chưa học, bắt đầu đếm từ hôm qua để không làm mất streak sớm.
  if (!set.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
