import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, AlertTriangle, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassPanel } from "@/components/common/GlassPanel";
import { ReviewStatusBadge } from "@/components/vocabulary/ReviewStatusBadge";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useDataRevision } from "@/stores/data-revision";
import { LANGUAGES } from "@/config/languages";
import { filterLibrary, type LibraryStatus } from "@/services/data/library";
import { cn } from "@/utils/cn";

const STATUS_TABS: { id: LibraryStatus; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "new", label: "Từ mới" },
  { id: "learning", label: "Đang học" },
  { id: "review", label: "Đang ôn" },
  { id: "mastered", label: "Đã thuộc" },
  { id: "due", label: "Đến hạn" },
  { id: "favorite", label: "Yêu thích" },
  { id: "weak", label: "Từ yếu" },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const revision = useDataRevision((s) => s.revision);
  const {
    allItems,
    progressMap,
    loading,
    loadLanguage,
    toggleFavorite,
    toggleWeak,
    queueSessionFromIds,
  } = useLearningStore();
  const lang = LANGUAGES[targetLanguage];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LibraryStatus>("all");

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage, revision]);

  const filtered = useMemo(
    () => filterLibrary(allItems, progressMap, { query, status }),
    [allItems, progressMap, query, status],
  );

  const startLearning = () => {
    if (filtered.length === 0) return;
    queueSessionFromIds(filtered.map((i) => i.id));
    navigate("/learn");
  };

  if (loading) return <LoadingState label="Đang tải kho từ…" />;

  return (
    <div>
      <PageHeader
        title="Kho từ"
        subtitle={`${lang.labelVi} · ${allItems.length} từ`}
      />

      <div className="glass mb-4 flex items-center gap-2 rounded-xl2 px-3 py-2">
        <Search size={18} className="text-ivory/40" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo từ, nghĩa, cách đọc hoặc chủ đề…"
          aria-label="Tìm kiếm trong kho từ"
          className="w-full bg-transparent text-sm text-ivory outline-none"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={status === t.id}
            onClick={() => setStatus(t.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              status === t.id ? "bg-corgi text-night" : "glass text-ivory/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-ivory/50">{filtered.length} kết quả</span>
        <button
          type="button"
          onClick={startLearning}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 rounded-full bg-corgi px-4 py-2 text-sm font-medium text-night disabled:opacity-40"
        >
          <GraduationCap size={16} /> Học các từ này
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Không có từ nào"
          description="Thử đổi từ khóa hoặc bộ lọc trạng thái."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((item) => {
            const p = progressMap.get(item.id);
            return (
              <li key={item.id}>
                <GlassPanel className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ivory">
                        {item.term}
                      </span>
                      {item.reading ? (
                        <span className="text-sm text-corgi">
                          {item.reading}
                        </span>
                      ) : null}
                      <ReviewStatusBadge status={item.reviewStatus} />
                    </div>
                    <p className="text-sm text-ivory/60">{item.meaningVi}</p>
                  </div>
                  <div className="flex gap-1">
                    <IconToggle
                      active={Boolean(p?.favorite)}
                      onClick={() => void toggleFavorite(item.id)}
                      label="Yêu thích"
                    >
                      <Star size={16} />
                    </IconToggle>
                    <IconToggle
                      active={Boolean(p?.markedWeak)}
                      onClick={() => void toggleWeak(item.id)}
                      label="Từ yếu"
                    >
                      <AlertTriangle size={16} />
                    </IconToggle>
                  </div>
                </GlassPanel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-full p-2",
        active ? "bg-corgi text-night" : "bg-ivory/10 text-ivory/70",
      )}
    >
      {children}
    </button>
  );
}
