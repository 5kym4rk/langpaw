import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { getAllProgress } from "@/db/repositories/progress-repository";
import { getStatsForLanguage } from "@/db/repositories/stats-repository";
import { computeStreak } from "@/services/session/streak";
import { recentDateKeys } from "@/utils/date";
import type { DailyStat, LearningState, VocabularyProgress } from "@/types";

const STATE_LABELS: Record<LearningState, string> = {
  new: "Từ mới",
  learning: "Đang học",
  review: "Đang ôn",
  mastered: "Đã thuộc",
};

export default function ProgressPage() {
  const [progress, setProgress] = useState<VocabularyProgress[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([getAllProgress(), getStatsForLanguage("all")]).then(
      ([p, s]) => {
        if (!active) return;
        setProgress(p);
        setStats(s);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const stateCounts = useMemo(() => {
    const counts: Record<LearningState, number> = {
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };
    for (const p of progress) counts[p.state] += 1;
    return counts;
  }, [progress]);

  const totalSeen = progress.length;
  const totalCorrect = progress.reduce((s, p) => s + p.correctCount, 0);
  const totalIncorrect = progress.reduce((s, p) => s + p.incorrectCount, 0);
  const accuracy =
    totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

  const statByDate = useMemo(() => {
    const map = new Map<string, DailyStat>();
    for (const s of stats) map.set(s.date, s);
    return map;
  }, [stats]);

  const streak = useMemo(
    () => computeStreak(stats.map((s) => s.date)),
    [stats],
  );

  const studyMinutes = Math.round(
    stats.reduce((s, d) => s + d.studyMs, 0) / 60000,
  );

  return (
    <div>
      <PageHeader title="Tiến độ" subtitle="Thống kê học tập của bạn" />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Tổng từ đã gặp" value={totalSeen} />
        <Stat label="Tỷ lệ đúng" value={`${accuracy}%`} />
        <Stat label="Chuỗi ngày học" value={streak} />
        <Stat label="Thời gian học" value={`${studyMinutes} phút`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        {(Object.keys(STATE_LABELS) as LearningState[]).map((s) => (
          <Stat key={s} label={STATE_LABELS[s]} value={stateCounts[s]} muted />
        ))}
      </div>

      <GlassPanel className="mt-6">
        <h2 className="mb-4 font-semibold">7 ngày gần nhất</h2>
        <BarChart days={7} statByDate={statByDate} />
      </GlassPanel>

      <GlassPanel className="mt-4">
        <h2 className="mb-4 font-semibold">30 ngày gần nhất</h2>
        <BarChart days={30} statByDate={statByDate} compact />
      </GlassPanel>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: number | string;
  muted?: boolean;
}) {
  return (
    <GlassPanel>
      <p className="text-sm text-ivory/60">{label}</p>
      <p
        className={
          muted
            ? "mt-1 text-2xl font-bold text-ivory"
            : "mt-1 text-3xl font-bold text-corgi"
        }
      >
        {value}
      </p>
    </GlassPanel>
  );
}

function BarChart({
  days,
  statByDate,
  compact,
}: {
  days: number;
  statByDate: Map<string, DailyStat>;
  compact?: boolean;
}) {
  const keys = recentDateKeys(days);
  const values = keys.map((k) => {
    const s = statByDate.get(k);
    return (s?.wordsStudied ?? 0) + (s?.reviewsDone ?? 0);
  });
  const max = Math.max(1, ...values);

  return (
    <div
      className="flex items-end gap-1"
      style={{ height: compact ? 80 : 120 }}
      role="img"
      aria-label={`Biểu đồ hoạt động ${days} ngày`}
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
  );
}
