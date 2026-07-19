import type { DailyStat } from "@/types";
import { recentDateKeys } from "@/utils/date";

interface HeatmapProps {
  days: number;
  statByDate: Map<string, DailyStat>;
}

function level(value: number, max: number): number {
  if (value <= 0) return 0;
  const ratio = value / max;
  if (ratio > 0.66) return 3;
  if (ratio > 0.33) return 2;
  return 1;
}

const LEVEL_CLASS = [
  "bg-ivory/5",
  "bg-corgi/30",
  "bg-corgi/60",
  "bg-corgi",
] as const;

/**
 * Lịch nhiệt hoạt động theo ngày (dạng contribution graph). Có bảng dữ liệu ẩn
 * cho screen reader.
 */
export function Heatmap({ days, statByDate }: HeatmapProps) {
  const keys = recentDateKeys(days);
  const values = keys.map((k) => {
    const s = statByDate.get(k);
    return (s?.wordsStudied ?? 0) + (s?.reviewsDone ?? 0);
  });
  const max = Math.max(1, ...values);

  // Chia thành các cột 7 ngày (tuần).
  const weeks: number[][] = [];
  for (let i = 0; i < keys.length; i += 7) {
    weeks.push(values.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto" aria-hidden>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((v, di) => (
              <div
                key={di}
                className={`h-3 w-3 rounded-sm ${LEVEL_CLASS[level(v, max)]}`}
                title={`${keys[wi * 7 + di]}: ${v} hoạt động`}
              />
            ))}
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Lịch hoạt động {days} ngày</caption>
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
