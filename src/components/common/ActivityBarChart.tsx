import type { DailyStat } from "@/types";
import { recentDateKeys } from "@/utils/date";

interface ActivityBarChartProps {
  days: number;
  statByDate: Map<string, DailyStat>;
  compact?: boolean;
}

/**
 * Biểu đồ cột hoạt động theo ngày (số từ học + số lượt ôn). Có bảng dữ liệu ẩn
 * cho screen reader (accessibility).
 */
export function ActivityBarChart({
  days,
  statByDate,
  compact,
}: ActivityBarChartProps) {
  const keys = recentDateKeys(days);
  const values = keys.map((k) => {
    const s = statByDate.get(k);
    return (s?.wordsStudied ?? 0) + (s?.reviewsDone ?? 0);
  });
  const max = Math.max(1, ...values);

  return (
    <div>
      <div
        className="flex items-end gap-1"
        style={{ height: compact ? 80 : 120 }}
        aria-hidden
      >
        {keys.map((k, i) => {
          const heightPct = (values[i] / max) * 100;
          return (
            <div
              key={k}
              className="flex flex-1 flex-col items-center justify-end"
              title={`${k}: ${values[i]} hoạt động`}
            >
              <div
                className="w-full rounded-t bg-corgi/70"
                style={{
                  height: `${Math.max(heightPct, values[i] > 0 ? 6 : 2)}%`,
                }}
              />
              {!compact ? (
                <span className="mt-1 text-[10px] text-ivory/40">
                  {k.slice(8)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {/* Bảng dữ liệu thay thế cho screen reader */}
      <table className="sr-only">
        <caption>Hoạt động {days} ngày gần nhất</caption>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Số hoạt động</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k, i) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{values[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
