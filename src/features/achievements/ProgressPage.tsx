import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { ActivityBarChart } from "@/components/common/ActivityBarChart";
import { getAllProgress } from "@/db/repositories/progress-repository";
import { getAllStats } from "@/db/repositories/stats-repository";
import { computeStreak } from "@/services/session/streak";
import { inferLanguageFromId } from "@/utils/vocabulary-id";
import { LANGUAGES, LANGUAGE_ORDER } from "@/config/languages";
import type {
  DailyStat,
  LanguageCode,
  LearningState,
  VocabularyProgress,
} from "@/types";
import { cn } from "@/utils/cn";

const STATE_LABELS: Record<LearningState, string> = {
  new: "Từ mới",
  learning: "Đang học",
  review: "Đang ôn",
  mastered: "Đã thuộc",
};

type Tab = "all" | LanguageCode;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Tổng quan" },
  ...LANGUAGE_ORDER.map((c) => ({ id: c, label: LANGUAGES[c].labelVi })),
];

export default function ProgressPage() {
  const [progress, setProgress] = useState<VocabularyProgress[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    let active = true;
    void Promise.all([getAllProgress(), getAllStats()]).then(([p, s]) => {
      if (!active) return;
      setProgress(p);
      setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);

  // Lọc theo tab ngôn ngữ.
  const scopedProgress = useMemo(
    () =>
      tab === "all"
        ? progress
        : progress.filter((p) => inferLanguageFromId(p.vocabularyId) === tab),
    [progress, tab],
  );
  const scopedStats = useMemo(
    () => stats.filter((s) => s.language === tab),
    [stats, tab],
  );

  const stateCounts = useMemo(() => {
    const counts: Record<LearningState, number> = {
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };
    for (const p of scopedProgress) counts[p.state] += 1;
    return counts;
  }, [scopedProgress]);

  const totalSeen = scopedProgress.length;
  const totalCorrect = scopedProgress.reduce((s, p) => s + p.correctCount, 0);
  const totalIncorrect = scopedProgress.reduce(
    (s, p) => s + p.incorrectCount,
    0,
  );
  const accuracy =
    totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

  const statByDate = useMemo(() => {
    const map = new Map<string, DailyStat>();
    for (const s of scopedStats) map.set(s.date, s);
    return map;
  }, [scopedStats]);

  const streak = useMemo(
    () => computeStreak(scopedStats.map((s) => s.date)),
    [scopedStats],
  );

  const studyMinutes = Math.round(
    scopedStats.reduce((s, d) => s + d.studyMs, 0) / 60000,
  );
  const reviewsDone = scopedStats.reduce((s, d) => s + d.reviewsDone, 0);

  return (
    <div>
      <PageHeader title="Tiến độ" subtitle="Thống kê học tập của bạn" />

      {/* Tab theo ngôn ngữ */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              tab === t.id ? "bg-corgi text-night" : "glass text-ivory/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Tổng từ đã gặp" value={totalSeen} />
        <Stat label="Tỷ lệ đúng" value={`${accuracy}%`} />
        <Stat label="Chuỗi ngày học" value={streak} />
        <Stat label="Lượt ôn tập" value={reviewsDone} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        {(Object.keys(STATE_LABELS) as LearningState[]).map((s) => (
          <Stat key={s} label={STATE_LABELS[s]} value={stateCounts[s]} muted />
        ))}
      </div>

      {studyMinutes > 0 ? (
        <p className="mt-3 text-sm text-ivory/50">
          Thời gian học: {studyMinutes} phút
        </p>
      ) : null}

      <GlassPanel className="mt-6">
        <h2 className="mb-4 font-semibold">7 ngày gần nhất</h2>
        <ActivityBarChart days={7} statByDate={statByDate} />
      </GlassPanel>

      <GlassPanel className="mt-4">
        <h2 className="mb-4 font-semibold">30 ngày gần nhất</h2>
        <ActivityBarChart days={30} statByDate={statByDate} compact />
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
