import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { VocabularyCard } from "@/components/vocabulary/VocabularyCard";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoLearn } from "./useAutoLearn";
import { speechService } from "@/services/speech/speech-service";
import { LANGUAGES } from "@/config/languages";
import { uniqueLevels, uniqueTopics } from "@/services/data/vocabulary-filters";
import { cn } from "@/utils/cn";

type Scope = "all" | "new" | "weak" | "favorite";

export default function LearningPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const {
    allItems,
    sessionItems,
    currentIndex,
    progressMap,
    loading,
    error,
    loadLanguage,
    startSession,
    next,
    previous,
    goTo,
    markKnown,
    markUnknown,
    toggleFavorite,
    toggleWeak,
  } = useLearningStore();

  const [level, setLevel] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [scope, setScope] = useState<Scope>("all");
  const [shuffleOrder, setShuffleOrder] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  // Hủy phát âm khi rời trang hoặc đổi ngôn ngữ (yêu cầu §11.3).
  useEffect(() => {
    return () => speechService.cancel();
  }, [targetLanguage]);

  const levels = useMemo(() => uniqueLevels(allItems), [allItems]);
  const topics = useMemo(() => uniqueTopics(allItems), [allItems]);

  const begin = () => {
    startSession({
      level: level || undefined,
      topic: topic || undefined,
      scope,
      shuffleOrder,
    });
    setFlipped(false);
  };

  const current = sessionItems[currentIndex];
  const lang = LANGUAGES[targetLanguage];

  const auto = useAutoLearn(sessionItems, (i) => {
    setFlipped(false);
    goTo(i);
  });

  const goNext = () => {
    speechService.cancel();
    setFlipped(false);
    next();
  };
  const goPrev = () => {
    speechService.cancel();
    setFlipped(false);
    previous();
  };
  const handleKnown = () => {
    if (!current) return;
    void markKnown(current.id);
    goNext();
  };
  const handleUnknown = () => {
    if (!current) return;
    void markUnknown(current.id);
    goNext();
  };

  useKeyboardShortcuts(
    {
      " ": () => setFlipped((f) => !f),
      ArrowLeft: handleUnknown,
      ArrowRight: handleKnown,
      r: () =>
        current &&
        void speechService.speak(current.term, {
          lang: lang.speechLocale,
        }),
      f: () => current && void toggleFavorite(current.id),
    },
    Boolean(current),
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

  const currentProgress = current ? progressMap.get(current.id) : undefined;

  return (
    <div>
      <PageHeader
        title="Học từ"
        subtitle={`${lang.labelVi} · ${allItems.length} từ trong bộ`}
      />

      {/* Bộ lọc */}
      <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-xl2 p-4">
        <Field label="Cấp độ">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg bg-night/60 px-3 py-2 text-sm text-ivory"
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
            className="rounded-lg bg-night/60 px-3 py-2 text-sm text-ivory"
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
            className="rounded-lg bg-night/60 px-3 py-2 text-sm text-ivory"
          >
            <option value="all">Tất cả</option>
            <option value="new">Từ mới</option>
            <option value="weak">Từ yếu</option>
            <option value="favorite">Yêu thích</option>
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
          className="ml-auto rounded-full bg-corgi px-5 py-2 font-medium text-night"
        >
          Bắt đầu học
        </button>
      </div>

      {!current ? (
        <EmptyState
          title="Chưa có phiên học"
          description="Chọn bộ lọc và nhấn “Bắt đầu học” để bắt đầu."
          icon={<Volume2 size={40} />}
        />
      ) : (
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-center text-sm text-ivory/50">
            {currentIndex + 1} / {sessionItems.length}
          </p>
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
              <span className="ml-1 text-xs text-corgi">Đang phát…</span>
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
              onClick={handleUnknown}
              className="flex items-center gap-2 rounded-full bg-danger/80 px-5 py-2.5 font-medium text-white"
            >
              <X size={18} /> Chưa nhớ
            </button>
            <button
              type="button"
              onClick={handleKnown}
              className="flex items-center gap-2 rounded-full bg-success px-5 py-2.5 font-medium text-white"
            >
              <Check size={18} /> Đã biết
            </button>
            <IconButton
              onClick={goNext}
              label="Tiếp theo"
              disabled={currentIndex >= sessionItems.length - 1}
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
            Phím tắt: Space lật · ← chưa nhớ · → đã biết · R phát âm · F yêu
            thích
          </p>
        </div>
      )}
    </div>
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
