import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Play,
  Pause,
  Square,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassPanel } from "@/components/common/GlassPanel";
import { VocabularyCard } from "@/components/vocabulary/VocabularyCard";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import { recordActivity } from "@/db/repositories/stats-repository";
import { useAutoLearn } from "./useAutoLearn";
import { speechService } from "@/services/speech/speech-service";
import { LANGUAGES } from "@/config/languages";
import {
  uniqueLevels,
  uniqueTopics,
  filterByReviewLevel,
  REVIEW_LEVEL_LABELS,
  type ReviewLevel,
} from "@/services/data/vocabulary-filters";
import { cn } from "@/utils/cn";

type Scope = "all" | "new" | "weak" | "favorite";
type Phase = "setup" | "running" | "completed";
type Outcome = "known" | "unknown" | "skipped";

const SESSION_SIZES = [5, 10, 20, 30, 0] as const; // 0 = tất cả
/** Trần số lần bỏ qua trong một phiên (§3.2 — giới hạn số lần bỏ qua). */
const SKIP_LIMIT = 20;

interface SessionSummary {
  total: number;
  known: number;
  unknown: number;
  skipped: number;
  wrongIds: string[];
  skippedIds: string[];
  elapsedMs: number;
}

export default function LearningPage() {
  const navigate = useNavigate();
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const dailyGoal = useSettingsStore((s) => s.settings.dailyGoal);
  const contentReviewLevel = useSettingsStore(
    (s) => s.settings.contentReviewLevel,
  );
  const {
    allItems,
    sessionItems,
    currentIndex,
    progressMap,
    loading,
    error,
    loadLanguage,
    startSession,
    startSessionFromIds,
    consumePendingRun,
    previous,
    goTo,
    markKnown,
    markUnknown,
    toggleFavorite,
    toggleWeak,
  } = useLearningStore();

  const [phase, setPhase] = useState<Phase>("setup");
  const [level, setLevel] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [scope, setScope] = useState<Scope>("all");
  const [reviewLevel, setReviewLevel] =
    useState<ReviewLevel>(contentReviewLevel);
  const [shuffleOrder, setShuffleOrder] = useState(false);
  const [sessionSize, setSessionSize] = useState<number>(dailyGoal);
  const [flipped, setFlipped] = useState(false);

  // Kết quả từng thẻ trong phiên hiện tại (nguồn sự thật cho bộ đếm).
  const [outcomes, setOutcomes] = useState<Map<string, Outcome>>(new Map());
  const startedAtRef = useRef<number>(0);
  const savingRef = useRef(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const studyTimer = useStudyTimer();

  const known = useMemo(
    () => [...outcomes.values()].filter((o) => o === "known").length,
    [outcomes],
  );
  const unknown = useMemo(
    () => [...outcomes.values()].filter((o) => o === "unknown").length,
    [outcomes],
  );
  const skipped = useMemo(
    () => [...outcomes.values()].filter((o) => o === "skipped").length,
    [outcomes],
  );

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  // Đổi ngôn ngữ → về màn thiết lập và hủy phát âm (§11.3).
  useEffect(() => {
    setPhase("setup");
    return () => speechService.cancel();
  }, [targetLanguage]);

  const levels = useMemo(() => uniqueLevels(allItems), [allItems]);
  const topics = useMemo(() => uniqueTopics(allItems), [allItems]);
  const reviewAvailable = useMemo(
    () => filterByReviewLevel(allItems, reviewLevel).length,
    [allItems, reviewLevel],
  );

  const current = sessionItems[currentIndex];
  const lang = LANGUAGES[targetLanguage];

  const auto = useAutoLearn(sessionItems, (i) => {
    setFlipped(false);
    goTo(i);
  });

  const resetCounters = () => {
    setOutcomes(new Map());
    startedAtRef.current = Date.now();
    studyTimer.start();
    setFlipped(false);
    setSummary(null);
  };

  // Phiên "học các từ này" xếp từ trang Kho từ → chạy ngay.
  useEffect(() => {
    if (consumePendingRun()) {
      resetCounters();
      setPhase("running");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = () => {
    startSession({
      level: level || undefined,
      topic: topic || undefined,
      scope,
      reviewLevel,
      shuffleOrder,
      sessionSize: sessionSize || undefined,
    });
    resetCounters();
    setPhase("running");
  };

  const relearnWrong = (ids: string[]) => {
    startSessionFromIds(ids);
    resetCounters();
    setPhase("running");
  };

  const finishFrom = (map: Map<string, Outcome>) => {
    auto.stop();
    speechService.cancel();
    const studyMs = studyTimer.stop();
    let k = 0;
    let u = 0;
    let s = 0;
    const wrongIds: string[] = [];
    const skippedIds: string[] = [];
    for (const it of sessionItems) {
      const o = map.get(it.id);
      if (o === "known") k += 1;
      else if (o === "unknown") {
        u += 1;
        wrongIds.push(it.id);
      } else if (o === "skipped") {
        s += 1;
        skippedIds.push(it.id);
      }
    }
    setSummary({
      total: sessionItems.length,
      known: k,
      unknown: u,
      skipped: s,
      wrongIds,
      skippedIds,
      elapsedMs: studyMs,
    });
    // Ghi thời gian học thật (loại trừ tab ẩn) cho ngôn ngữ đang học (§3.6).
    if (studyMs > 0) void recordActivity(targetLanguage, { studyMs });
    setPhase("completed");
  };

  /** Chỉ số thẻ chưa đánh giá kế tiếp (cuộn vòng); -1 nếu đã đánh giá hết. */
  const nextUntouchedIndex = (map: Map<string, Outcome>): number => {
    const n = sessionItems.length;
    for (let step = 1; step <= n; step += 1) {
      const idx = (currentIndex + step) % n;
      if (!map.has(sessionItems[idx].id)) return idx;
    }
    return -1;
  };

  const applyOutcome = (map: Map<string, Outcome>) => {
    setOutcomes(map);
    speechService.cancel();
    setFlipped(false);
    // Không cho hoàn thành khi còn thẻ chưa đánh giá (§3.2).
    const idx = nextUntouchedIndex(map);
    if (idx === -1) finishFrom(map);
    else goTo(idx);
  };

  const grade = async (isKnown: boolean) => {
    if (savingRef.current || phase !== "running" || !current) return;
    savingRef.current = true;
    try {
      if (isKnown) await markKnown(current.id);
      else await markUnknown(current.id);
    } finally {
      savingRef.current = false;
    }
    applyOutcome(
      new Map(outcomes).set(current.id, isKnown ? "known" : "unknown"),
    );
  };

  const skip = () => {
    if (phase !== "running" || !current) return;
    // Bỏ qua không ghi đúng/sai và không tính vào số từ đã học (§3.2).
    applyOutcome(new Map(outcomes).set(current.id, "skipped"));
  };

  const goPrev = () => {
    speechService.cancel();
    setFlipped(false);
    previous();
  };

  useKeyboardShortcuts(
    {
      " ": () => setFlipped((f) => !f),
      ArrowLeft: () => void grade(false),
      ArrowRight: () => void grade(true),
      s: () => skipped < SKIP_LIMIT && skip(),
      r: () =>
        current &&
        void speechService.speak(current.term, { lang: lang.speechLocale }),
      f: () => current && void toggleFavorite(current.id),
    },
    phase === "running" && Boolean(current),
  );

  if (loading) return <LoadingState label="Đang tải bộ từ…" />;
  if (error)
    return (
      <EmptyState
        title="Không tải được bộ từ"
        description={error}
        icon={<AlertTriangle size={40} />}
      />
    );

  // ---- Màn hoàn thành ----
  if (phase === "completed" && summary) {
    const graded = summary.known + summary.unknown;
    const accuracy =
      graded > 0 ? Math.round((summary.known / graded) * 100) : 0;
    const seconds = Math.round(summary.elapsedMs / 1000);
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Hoàn thành phiên học 🎉" />
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Đã biết" value={summary.known} tone="success" />
          <Stat label="Chưa nhớ" value={summary.unknown} tone="danger" />
          <Stat label="Bỏ qua" value={summary.skipped} />
          <Stat label="Tỷ lệ nhớ" value={`${accuracy}%`} />
        </div>
        <p className="mt-2 text-center text-sm text-ivory/50">
          Đã đánh giá {summary.known + summary.unknown}/{summary.total} thẻ
          {summary.skipped > 0 ? ` · ${summary.skipped} thẻ bỏ qua` : ""}
        </p>
        <p className="mt-3 text-center text-sm text-ivory/50">
          Thời gian học thực: {seconds}s
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={summary.wrongIds.length === 0}
            onClick={() => relearnWrong(summary.wrongIds)}
            className="flex items-center gap-2 rounded-full bg-corgi px-5 py-2.5 font-medium text-night disabled:opacity-40"
          >
            <RotateCcw size={18} /> Học lại từ sai ({summary.wrongIds.length})
          </button>
          {summary.skippedIds.length > 0 ? (
            <button
              type="button"
              onClick={() => relearnWrong(summary.skippedIds)}
              className="flex items-center gap-2 rounded-full bg-ivory/10 px-5 py-2.5 font-medium text-ivory"
            >
              <RotateCcw size={18} /> Học thẻ bỏ qua (
              {summary.skippedIds.length})
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPhase("setup")}
            className="glass rounded-full px-5 py-2.5 font-medium text-ivory"
          >
            Phiên mới
          </button>
          <button
            type="button"
            onClick={() => navigate("/review")}
            className="flex items-center gap-2 rounded-full bg-ivory/10 px-5 py-2.5 font-medium text-ivory"
          >
            <RefreshCw size={18} /> Sang ôn tập
          </button>
        </div>
      </div>
    );
  }

  // ---- Màn thiết lập ----
  if (phase === "setup" || !current) {
    return (
      <div>
        <PageHeader
          title="Học từ"
          subtitle={`${lang.labelVi} · ${allItems.length} từ trong bộ`}
        />
        <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-xl2 p-4">
          <Field label="Cấp độ">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
            >
              <option value="">Tất cả</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Chủ đề">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
            >
              <option value="">Tất cả</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nhóm từ">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
            >
              <option value="all">Tất cả</option>
              <option value="new">Từ mới</option>
              <option value="weak">Từ yếu</option>
              <option value="favorite">Yêu thích</option>
            </select>
          </Field>
          <Field label="Số từ/phiên">
            <select
              value={sessionSize}
              onChange={(e) => setSessionSize(Number(e.target.value))}
              className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
            >
              {SESSION_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Tất cả" : n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nguồn">
            <select
              value={reviewLevel}
              onChange={(e) => setReviewLevel(e.target.value as ReviewLevel)}
              className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
            >
              {(["all", "reviewed", "verified"] as ReviewLevel[]).map((lv) => (
                <option key={lv} value={lv}>
                  {REVIEW_LEVEL_LABELS[lv]}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-ivory/80">
            <input
              type="checkbox"
              checked={shuffleOrder}
              onChange={(e) => setShuffleOrder(e.target.checked)}
            />
            Ngẫu nhiên
          </label>
          <button
            type="button"
            onClick={begin}
            disabled={reviewAvailable === 0}
            className="ml-auto rounded-full bg-corgi px-5 py-2 font-medium text-night disabled:opacity-40"
          >
            Bắt đầu học
          </button>
        </div>
        {reviewLevel !== "all" && reviewAvailable === 0 ? (
          <EmptyState
            title="Chưa có nội dung ở mức này"
            description={`Chưa có từ nào đạt mức “${REVIEW_LEVEL_LABELS[reviewLevel]}”. Hãy chọn “Gồm cả bản nháp” để học dữ liệu chưa kiểm duyệt.`}
            icon={<AlertTriangle size={40} />}
          />
        ) : (
          <EmptyState
            title="Chưa có phiên học"
            description="Chọn bộ lọc và nhấn “Bắt đầu học” để bắt đầu."
            icon={<Volume2 size={40} />}
          />
        )}
      </div>
    );
  }

  // ---- Màn đang học ----
  const currentProgress = progressMap.get(current.id);
  const done = known + unknown + skipped;
  const progressPct =
    sessionItems.length > 0 ? (done / sessionItems.length) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Học từ"
        subtitle={`${lang.labelVi} · còn ${sessionItems.length - done} từ`}
      />
      <div className="mx-auto max-w-2xl">
        {/* Thanh tiến độ phiên */}
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs text-ivory/50">
            <span>
              {done} / {sessionItems.length}
            </span>
            <span>{currentIndex + 1}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ivory/10">
            <div
              className="h-full bg-corgi transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <VocabularyCard
          item={current}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />

        {/* Điều khiển chế độ tự động (§11) */}
        <div className="glass mt-3 flex items-center justify-center gap-2 rounded-full px-3 py-2">
          <span className="mr-1 text-xs text-ivory/50">Tự động:</span>
          {auto.status !== "playing" ? (
            <IconButton
              onClick={auto.status === "paused" ? auto.resume : auto.start}
              label="Phát tự động"
            >
              <Play size={18} />
            </IconButton>
          ) : (
            <IconButton onClick={auto.pause} label="Tạm dừng">
              <Pause size={18} />
            </IconButton>
          )}
          <IconButton
            onClick={auto.stop}
            label="Dừng"
            disabled={auto.status === "idle"}
          >
            <Square size={16} />
          </IconButton>
          <IconButton onClick={auto.previous} label="Từ trước tự động">
            <ChevronLeft size={18} />
          </IconButton>
          <IconButton onClick={auto.next} label="Từ tiếp theo tự động">
            <ChevronRight size={18} />
          </IconButton>
          {auto.status === "playing" ? (
            <span className="ml-1 text-xs text-corgi-text">Đang phát…</span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <IconButton
            onClick={goPrev}
            label="Trước"
            disabled={currentIndex === 0}
          >
            <ChevronLeft />
          </IconButton>
          <button
            type="button"
            onClick={() => void grade(false)}
            className="flex items-center gap-2 rounded-full bg-danger/80 px-5 py-2.5 font-medium text-white"
          >
            <X size={18} /> Chưa nhớ
          </button>
          <button
            type="button"
            onClick={() => void grade(true)}
            className="flex items-center gap-2 rounded-full bg-success px-5 py-2.5 font-medium text-white"
          >
            <Check size={18} /> Đã biết
          </button>
          <IconButton
            onClick={skip}
            label={
              skipped >= SKIP_LIMIT
                ? `Đã đạt giới hạn bỏ qua (${SKIP_LIMIT})`
                : "Bỏ qua (để lại cuối phiên)"
            }
            disabled={skipped >= SKIP_LIMIT}
          >
            <ChevronRight />
          </IconButton>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <ToggleChip
            active={Boolean(currentProgress?.favorite)}
            onClick={() => void toggleFavorite(current.id)}
            icon={<Star size={16} />}
            label="Yêu thích"
          />
          <ToggleChip
            active={Boolean(currentProgress?.markedWeak)}
            onClick={() => void toggleWeak(current.id)}
            icon={<AlertTriangle size={16} />}
            label="Từ yếu"
          />
        </div>

        <p className="mt-4 text-center text-xs text-ivory/40">
          Phím tắt: Space lật · ← chưa nhớ · → đã biết · S bỏ qua · R phát âm ·
          F yêu thích
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-emerald-300"
      : tone === "danger"
        ? "text-danger-text"
        : "text-corgi-text";
  return (
    <GlassPanel>
      <p className="text-sm text-ivory/60">{label}</p>
      <p className={cn("mt-1 text-3xl font-bold", color)}>{value}</p>
    </GlassPanel>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ivory/60">
      {label}
      {children}
    </label>
  );
}

function IconButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-full bg-ivory/10 p-2.5 text-ivory disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
        active ? "bg-corgi text-night" : "glass text-ivory/70",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
