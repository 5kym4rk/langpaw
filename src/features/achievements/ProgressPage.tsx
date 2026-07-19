import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { ActivityBarChart } from "@/components/common/ActivityBarChart";
import { Heatmap } from "@/components/common/Heatmap";
import { getAllProgress } from "@/db/repositories/progress-repository";
import { getAllStats } from "@/db/repositories/stats-repository";
import { loadVocabulary } from "@/services/data/vocabulary-loader";
import { computeStreak } from "@/services/session/streak";
import {
  computeTopicStats,
  topWrongWords,
} from "@/services/session/progress-insights";
import { inferLanguageFromId } from "@/utils/vocabulary-id";
import { useDataRevision } from "@/stores/data-revision";
import { LANGUAGES, LANGUAGE_ORDER } from "@/config/languages";
import type {
  DailyStat,
  LanguageCode,
  LearningState,
  VocabularyItem,
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
  const [itemsById, setItemsById] = useState<Map<string, VocabularyItem>>(
    new Map(),
  );
  const [tab, setTab] = useState<Tab>("all");
  const revision = useDataRevision((s) => s.revision);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [p, s, ...langItems] = await Promise.all([
        getAllProgress(),
        getAllStats(),
        ...LANGUAGE_ORDER.map((c) => loadVocabulary(c)),
      ]);
      if (!active) return;
      setProgress(p);
      setStats(s);
      const map = new Map<string, VocabularyItem>();
      for (const list of langItems) for (const it of list) map.set(it.id, it);
      setItemsById(map);
    })();
    return () => {
      active = false;
    };
  }, [revision]);

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

  const topicStats = useMemo(
    () => computeTopicStats(scopedProgress, itemsById),
    [scopedProgress, itemsById],
  );
  const strongTopics = useMemo(
    () => topicStats.filter((t) => t.correct + t.incorrect >= 2).slice(0, 3),
    [topicStats],
  );
  const weakTopics = useMemo(
    () =>
      topicStats
        .filter((t) => t.correct + t.incorrect >= 2)
        .slice(-3)
        .reverse(),
    [topicStats],
  );
  const wrongWords = useMemo(
    () => topWrongWords(scopedProgress, itemsById, 5),
    [scopedProgress, itemsById],
  );

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

      <GlassPanel className="mt-4">
        <h2 className="mb-4 font-semibold">Lịch hoạt động 90 ngày</h2>
        <Heatmap days={91} statByDate={statByDate} />
      </GlassPanel>

      {(strongTopics.length > 0 || weakTopics.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <GlassPanel>
            <h2 className="mb-3 font-semibold text-emerald-300">Chủ đề mạnh</h2>
            {strongTopics.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {strongTopics.map((t) => (
                  <TopicRow
                    key={t.topic}
                    topic={t.topic}
                    accuracy={t.accuracy}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ivory/50">Chưa đủ dữ liệu.</p>
            )}
          </GlassPanel>
          <GlassPanel>
            <h2 className="mb-3 font-semibold text-danger">
              Chủ đề cần cải thiện
            </h2>
            {weakTopics.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {weakTopics.map((t) => (
                  <TopicRow
                    key={t.topic}
                    topic={t.topic}
                    accuracy={t.accuracy}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ivory/50">Chưa đủ dữ liệu.</p>
            )}
          </GlassPanel>
        </div>
      )}

      {wrongWords.length > 0 ? (
        <GlassPanel className="mt-4">
          <h2 className="mb-3 font-semibold">Từ sai nhiều nhất</h2>
          <ul className="flex flex-col gap-2">
            {wrongWords.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-night/40 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-ivory">{w.term}</p>
                  <p className="text-sm text-ivory/60">{w.meaningVi}</p>
                </div>
                <span className="rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">
                  sai {w.incorrectCount} lần
                </span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      ) : null}
    </div>
  );
}

function TopicRow({ topic, accuracy }: { topic: string; accuracy: number }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="min-w-0 flex-1 truncate text-sm text-ivory/85">
        {topic}
      </span>
      <span className="text-sm font-medium text-corgi">{accuracy}%</span>
    </li>
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
