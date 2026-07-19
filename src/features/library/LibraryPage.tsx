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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  filterByReviewLevel,
  REVIEW_LEVEL_LABELS,
  type ReviewLevel,
} from "@/services/data/vocabulary-filters";
import { cn } from "@/utils/cn";

const SESSION_SIZE_OPTIONS = [5, 10, 20, 30] as const;
/** Trên ngưỡng này, phiên "tất cả" cần xác nhận (§3.7). */
const CONFIRM_ALL_THRESHOLD = 30;
/** Số mục hiển thị tối đa cùng lúc để không treo với bộ từ rất lớn. */
const RENDER_LIMIT = 300;

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

  const contentReviewLevel = useSettingsStore(
    (s) => s.settings.contentReviewLevel,
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LibraryStatus>("all");
  const [reviewLevel, setReviewLevel] =
    useState<ReviewLevel>(contentReviewLevel);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage, revision]);

  // Kho từ phải tôn trọng mức kiểm duyệt trước khi lọc trạng thái (§3.7).
  const filtered = useMemo(
    () =>
      filterLibrary(filterByReviewLevel(allItems, reviewLevel), progressMap, {
        query,
        status,
      }),
    [allItems, progressMap, query, status, reviewLevel],
  );

  const startWith = (count?: number) => {
    const ids = (count ? filtered.slice(0, count) : filtered).map((i) => i.id);
    if (ids.length === 0) return;
    setMenuOpen(false);
    setConfirmAll(false);
    queueSessionFromIds(ids);
    navigate("/learn");
  };

  const requestAll = () => {
    setMenuOpen(false);
    if (filtered.length > CONFIRM_ALL_THRESHOLD) setConfirmAll(true);
    else startWith();
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-ivory/50">
            {filtered.length} kết quả
          </span>
          <label className="flex items-center gap-1.5 text-xs text-ivory/60">
            Nguồn
            <select
              value={reviewLevel}
              onChange={(e) => setReviewLevel(e.target.value as ReviewLevel)}
              className="rounded-lg bg-night px-2 py-1 text-sm text-ivory"
              aria-label="Lọc theo mức kiểm duyệt"
            >
              {(["all", "reviewed", "verified"] as ReviewLevel[]).map((lv) => (
                <option key={lv} value={lv}>
                  {REVIEW_LEVEL_LABELS[lv]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={filtered.length === 0}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full bg-corgi px-4 py-2 text-sm font-medium text-night disabled:opacity-40"
          >
            <GraduationCap size={16} /> Học các từ này
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="glass-strong absolute right-0 z-20 mt-2 w-52 rounded-xl2 p-2"
            >
              <p className="px-2 py-1 text-xs text-ivory/50">
                Số từ đưa vào phiên
              </p>
              {SESSION_SIZE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="menuitem"
                  disabled={filtered.length < n}
                  onClick={() => startWith(n)}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-ivory hover:bg-ivory/10 disabled:opacity-30"
                >
                  {n} từ đầu tiên
                </button>
              ))}
              <button
                type="button"
                role="menuitem"
                onClick={requestAll}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-ivory hover:bg-ivory/10"
              >
                Tất cả ({filtered.length})
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmAll}
        title="Học tất cả từ đã lọc?"
        message={`Phiên sẽ gồm ${filtered.length} từ. Bạn có chắc muốn học toàn bộ trong một phiên không?`}
        confirmLabel={`Học ${filtered.length} từ`}
        cancelLabel="Hủy"
        onConfirm={() => startWith()}
        onCancel={() => setConfirmAll(false)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Không có từ nào"
          description="Thử đổi từ khóa hoặc bộ lọc trạng thái."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.slice(0, RENDER_LIMIT).map((item) => {
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
                        <span className="text-sm text-corgi-text">
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
      {filtered.length > RENDER_LIMIT ? (
        <p className="mt-3 text-center text-xs text-ivory/40">
          Hiển thị {RENDER_LIMIT}/{filtered.length} từ. Dùng tìm kiếm hoặc bộ
          lọc để thu hẹp kết quả.
        </p>
      ) : null}
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
