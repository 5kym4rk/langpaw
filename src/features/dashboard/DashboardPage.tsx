import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, RefreshCw, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { ActivityBarChart } from "@/components/common/ActivityBarChart";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES } from "@/config/languages";
import { getAllProgress } from "@/db/repositories/progress-repository";
import { getStatsForLanguage } from "@/db/repositories/stats-repository";
import { computeStreak } from "@/services/session/streak";
import { summarizeProgress } from "@/services/session/stats";
import { inferLanguageFromId } from "@/utils/vocabulary-id";
import type { DailyStat, VocabularyProgress } from "@/types";

export default function DashboardPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const dailyGoal = useSettingsStore((s) => s.settings.dailyGoal);
  const lang = LANGUAGES[targetLanguage];

  const [progress, setProgress] = useState<VocabularyProgress[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);

  // Tải lại khi đổi ngôn ngữ để thống kê khớp ngôn ngữ đang chọn.
  useEffect(() => {
    let active = true;
    void Promise.all([
      getAllProgress(),
      getStatsForLanguage(targetLanguage),
    ]).then(([all, langStats]) => {
      if (!active) return;
      setProgress(all);
      setStats(langStats);
    });
    return () => {
      active = false;
    };
  }, [targetLanguage]);

  // Chỉ tính tiến độ của ngôn ngữ đang chọn.
  const langProgress = useMemo(
    () =>
      progress.filter(
        (p) => inferLanguageFromId(p.vocabularyId) === targetLanguage,
      ),
    [progress, targetLanguage],
  );
  const summary = useMemo(
    () => summarizeProgress(langProgress),
    [langProgress],
  );
  const streak = useMemo(
    () => computeStreak(stats.map((s) => s.date)),
    [stats],
  );
  const todayStudied = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return stats.find((s) => s.date === today)?.wordsStudied ?? 0;
  }, [stats]);

  const statByDate = useMemo(() => {
    const map = new Map<string, DailyStat>();
    for (const s of stats) map.set(s.date, s);
    return map;
  }, [stats]);

  const hasActivity = stats.length > 0 || langProgress.length > 0;

  return (
    <div>
      <PageHeader
        title="Xin chào 👋"
        subtitle={`Bạn đang học ${lang.labelVi}. Hãy bắt đầu ngày học mới!`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Chuỗi ngày học" value={streak} unit="ngày" />
        <StatCard label="Từ đã học" value={summary.learned} unit="từ" />
        <StatCard label="Cần ôn hôm nay" value={summary.due} unit="từ" />
        <StatCard
          label="Mục tiêu ngày"
          value={`${todayStudied}/${dailyGoal}`}
          unit="từ"
          hint={`${lang.labelVi}`}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ActionCard to="/learn" icon={<GraduationCap />} label="Bắt đầu học" />
        <ActionCard to="/review" icon={<RefreshCw />} label="Ôn từ đến hạn" />
        <ActionCard
          to="/interview"
          icon={<Briefcase />}
          label="Luyện phỏng vấn"
        />
      </div>

      <GlassPanel className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Bảy ngày gần nhất · {lang.labelVi}
          </h2>
          <Link to="/progress" className="text-sm text-corgi">
            Xem chi tiết
          </Link>
        </div>
        {hasActivity ? (
          <ActivityBarChart days={7} statByDate={statByDate} />
        ) : (
          <p className="text-sm text-ivory/60">
            Biểu đồ tiến độ sẽ hiển thị khi bạn bắt đầu học.
          </p>
        )}
      </GlassPanel>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number | string;
  unit: string;
  hint?: string;
}) {
  return (
    <GlassPanel>
      <p className="text-sm text-ivory/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-corgi">
        {value}
        <span className="ml-1 text-base font-normal text-ivory/50">{unit}</span>
      </p>
      {hint ? <p className="mt-1 text-xs text-ivory/40">{hint}</p> : null}
    </GlassPanel>
  );
}

function ActionCard({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="glass flex items-center gap-3 rounded-xl2 px-5 py-4 font-medium text-ivory transition-transform hover:-translate-y-0.5"
    >
      <span className="text-corgi" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}
