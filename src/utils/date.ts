/** Khóa ngày theo giờ địa phương dạng YYYY-MM-DD. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Trả về mảng khóa ngày cho `count` ngày gần nhất (cũ → mới), gồm hôm nay. */
export function recentDateKeys(
  count: number,
  today: Date = new Date(),
): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(localDateKey(d));
  }
  return keys;
}
