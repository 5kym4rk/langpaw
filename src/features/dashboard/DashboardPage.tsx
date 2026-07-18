import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, RefreshCw, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES } from "@/config/languages";
import { getAllProgress } from "@/db/repositories/progress-repository";
import { getStatsForLanguage } from "@/db/repositories/stats-repository";
import { computeStreak } from "@/services/session/streak";
import {
  summarizeProgress,
  type ProgressSummary,
} from "@/services/session/stats";

const EMPTY: ProgressSummary = {
  total: 0,
  learned: 0,
  due: 0,
  weak: 0,
  favorite: 0,
};

export default function DashboardPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const dailyGoal = useSettingsStore((s) => s.settings.dailyGoal);
  const lang = LANGUAGES[targetLanguage];
  const [summary, setSummary] = useState<ProgressSummary>(EMPTY);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([getAllProgress(), getStatsForLanguage("all")]).then(
      ([all, stats]) => {
        if (!active) return;
        setSummary(summarizeProgress(all));
        setStreak(computeStreak(stats.map((s) => s.date)));
      },
    );
    return () => {
      active = false;
    };
  }, []);

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
          value={dailyGoal}
          unit="từ"
          hint="Đặt trong Cài đặt"
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
        <h2 className="text-lg font-semibold">Bảy ngày gần nhất</h2>
        <p className="mt-1 text-sm text-ivory/60">
          {summary.learned > 0
            ? "Biểu đồ tiến độ chi tiết sẽ có ở Giai đoạn 3."
            : "Biểu đồ tiến độ sẽ hiển thị khi bạn bắt đầu học."}
        </p>
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
  value: number;
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
