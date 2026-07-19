import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Check, X, RotateCcw, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { GlassPanel } from "@/components/common/GlassPanel";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES } from "@/config/languages";
import { buildChoices } from "@/services/quiz/distractors";
import {
  shuffle,
  filterByReviewLevel,
} from "@/services/data/vocabulary-filters";
import { isAnswerCorrect } from "@/services/quiz/normalize-answer";
import { speechService } from "@/services/speech/speech-service";
import { buildSpeakOptions } from "@/services/speech/speak-options";
import { recordPracticeResult } from "@/services/session/practice";
import type { VocabularyItem } from "@/types";
import { cn } from "@/utils/cn";

type Mode = "choose" | "type";
type Phase = "setup" | "running" | "result";

const COUNTS = [5, 10, 20] as const;
const SPEEDS = [0.6, 0.8, 1, 1.2] as const;

interface AnswerRecord {
  item: VocabularyItem;
  correct: boolean;
}

export default function ListeningPage() {
  const settings = useSettingsStore((s) => s.settings);
  const targetLanguage = settings.targetLanguage;
  const speechEnabled = settings.speechEnabled;
  const contentReviewLevel = settings.contentReviewLevel;
  const { allItems, loading, loadLanguage, toggleWeak } = useLearningStore();
  const lang = LANGUAGES[targetLanguage];
  const pool = useMemo(
    () => filterByReviewLevel(allItems, contentReviewLevel),
    [allItems, contentReviewLevel],
  );

  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("choose");
  const [count, setCount] = useState<number>(10);
  const [speed, setSpeed] = useState<number>(1);
  const [queue, setQueue] = useState<VocabularyItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const startedAtRef = useRef(0);
  const questionStartRef = useRef(0); // Mốc thời gian câu hiện tại (§3.6).
  const savingRef = useRef(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPlayTimer = () => {
    if (playTimerRef.current !== null) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  };

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  // Đổi ngôn ngữ → về setup, hủy speech và timeout đang chờ (P1.5).
  useEffect(() => {
    setPhase("setup");
    return () => {
      clearPlayTimer();
      speechService.cancel();
    };
  }, [targetLanguage]);

  // Cleanup khi unmount.
  useEffect(() => {
    return () => {
      clearPlayTimer();
      speechService.cancel();
    };
  }, []);

  const current = queue[index];
  const choices = useMemo(
    () => (current ? buildChoices(current, allItems, 4) : []),
    [current, allItems],
  );

  const playCurrent = (item: VocabularyItem) => {
    if (!speechEnabled) return;
    void speechService.speak(
      item.term,
      buildSpeakOptions(settings, targetLanguage, speed),
    );
  };

  const playExample = (item: VocabularyItem) => {
    if (!speechEnabled || !item.example) return;
    void speechService.speak(
      item.example,
      buildSpeakOptions(settings, targetLanguage, speed),
    );
  };

  const schedulePlay = (item: VocabularyItem | undefined, delay: number) => {
    clearPlayTimer();
    if (!item) return;
    playTimerRef.current = setTimeout(() => {
      playTimerRef.current = null;
      playCurrent(item);
    }, delay);
  };

  const begin = () => {
    const q = shuffle(pool).slice(0, count);
    setQueue(q);
    setIndex(0);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    setAnswers([]);
    startedAtRef.current = Date.now();
    questionStartRef.current = Date.now();
    setPhase("running");
    schedulePlay(q[0], 300);
  };

  const check = () => {
    if (revealed || !current || savingRef.current) return;
    if (mode === "choose" && !selected) return;
    const correct =
      mode === "choose"
        ? selected === current.id
        : isAnswerCorrect(
            textAnswer,
            [current.term, ...(current.alternateForms ?? [])],
            current.language,
            { ignorePinyinTones: current.language === "zh" },
          );
    savingRef.current = true;
    setAnswers((prev) => [...prev, { item: current, correct }]);
    setRevealed(true);
    void recordPracticeResult({
      vocabularyId: current.id,
      language: current.language,
      activityType: "listening",
      correct,
      durationMs: Date.now() - questionStartRef.current,
    }).finally(() => {
      savingRef.current = false;
    });
  };

  const goNext = () => {
    clearPlayTimer();
    speechService.cancel();
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setPhase("result");
      return;
    }
    setIndex(nextIndex);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    questionStartRef.current = Date.now();
    schedulePlay(queue[nextIndex], 200);
  };

  const relearnWrong = (items: VocabularyItem[]) => {
    setQueue(items);
    setIndex(0);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    setAnswers([]);
    startedAtRef.current = Date.now();
    questionStartRef.current = Date.now();
    setPhase("running");
    schedulePlay(items[0], 300);
  };

  if (loading) return <LoadingState label="Đang tải bộ từ…" />;

  // ---- Setup ----
  if (phase === "setup") {
    return (
      <div>
        <PageHeader
          title="Luyện nghe"
          subtitle={`${lang.labelVi} · ${pool.length} từ khả dụng`}
        />
        <GlassPanel className="mx-auto max-w-md">
          <h2 className="mb-3 font-semibold">Chế độ</h2>
          <div className="mb-4 flex gap-2">
            <ModeButton
              active={mode === "choose"}
              onClick={() => setMode("choose")}
            >
              Nghe → chọn nghĩa
            </ModeButton>
            <ModeButton
              active={mode === "type"}
              onClick={() => setMode("type")}
            >
              Nghe → nhập từ
            </ModeButton>
          </div>
          <h2 className="mb-2 font-semibold">Số câu</h2>
          <div className="mb-5 flex gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                aria-pressed={count === n}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  count === n ? "bg-corgi text-night" : "glass text-ivory/80",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <h2 className="mb-2 font-semibold">Tốc độ phát</h2>
          <div className="mb-5 flex gap-2">
            {SPEEDS.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSpeed(sp)}
                aria-pressed={speed === sp}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  speed === sp ? "bg-corgi text-night" : "glass text-ivory/80",
                )}
              >
                {sp}×
              </button>
            ))}
          </div>
          {!speechEnabled ? (
            <p className="mb-4 text-sm text-danger-text">
              Phát âm đang tắt. Bật lại trong Cài đặt để luyện nghe.
            </p>
          ) : null}
          <button
            type="button"
            onClick={begin}
            disabled={pool.length < 4 || !speechEnabled}
            className="w-full rounded-full bg-corgi px-5 py-2.5 font-medium text-night disabled:opacity-40"
          >
            Bắt đầu
          </button>
        </GlassPanel>
      </div>
    );
  }

  // ---- Result ----
  if (phase === "result") {
    const correctCount = answers.filter((a) => a.correct).length;
    const wrong = answers.filter((a) => !a.correct);
    const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
    const score =
      answers.length > 0
        ? Math.round((correctCount / answers.length) * 100)
        : 0;
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Kết quả luyện nghe" />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Điểm" value={`${score}%`} />
          <StatCard
            label="Đúng / Sai"
            value={`${correctCount} / ${wrong.length}`}
          />
          <StatCard label="Thời gian" value={`${seconds}s`} />
        </div>

        {wrong.length > 0 ? (
          <GlassPanel className="mt-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-danger-text">
              <AlertTriangle size={18} /> Từ nghe sai ({wrong.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {wrong.map((a) => (
                <li
                  key={a.item.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-night/40 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-ivory">{a.item.term}</p>
                    <p className="text-sm text-ivory/60">{a.item.meaningVi}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleWeak(a.item.id)}
                    className="rounded-full bg-ivory/10 px-3 py-1.5 text-xs text-ivory"
                  >
                    + Từ yếu
                  </button>
                </li>
              ))}
            </ul>
          </GlassPanel>
        ) : (
          <GlassPanel className="mt-4 text-center">
            <p className="flex items-center justify-center gap-2 text-success-text">
              <Check /> Bạn nghe đúng tất cả!
            </p>
          </GlassPanel>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {wrong.length > 0 ? (
            <button
              type="button"
              onClick={() => relearnWrong(wrong.map((a) => a.item))}
              className="flex items-center gap-2 rounded-full bg-corgi px-5 py-2.5 font-medium text-night"
            >
              <RotateCcw size={18} /> Nghe lại từ sai
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPhase("setup")}
            className="glass rounded-full px-5 py-2.5 font-medium text-ivory"
          >
            Làm lại
          </button>
        </div>
      </div>
    );
  }

  // ---- Running ----
  if (!current) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Luyện nghe"
        subtitle={`${index + 1} / ${queue.length}`}
      />
      <GlassPanel strong>
        <div className="mb-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => playCurrent(current)}
            aria-label="Nghe lại"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-corgi/25 text-corgi-text hover:bg-corgi/35"
          >
            <Volume2 size={36} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ivory/50">Nhấn để nghe lại</span>
            <span className="text-xs text-ivory/40">· {speed}×</span>
          </div>
          {revealed ? (
            <button
              type="button"
              onClick={() => playExample(current)}
              className="rounded-full bg-corgi/20 px-3 py-1.5 text-sm text-corgi-text hover:bg-corgi/30"
            >
              Nghe câu ví dụ
            </button>
          ) : null}
        </div>

        {mode === "choose" ? (
          <div className="grid gap-2">
            {choices.map((choice) => {
              const isCorrect = choice.id === current.id;
              const isPicked = choice.id === selected;
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(choice.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-ivory transition-colors",
                    revealed && isCorrect && "border-success bg-success/20",
                    revealed &&
                      isPicked &&
                      !isCorrect &&
                      "border-danger bg-danger/20",
                    !revealed && isPicked && "border-corgi bg-corgi/15",
                    !revealed &&
                      !isPicked &&
                      "border-ivory/15 hover:border-ivory/40",
                  )}
                >
                  {choice.meaningVi}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={textAnswer}
              disabled={revealed}
              onChange={(e) => setTextAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder="Nhập từ bạn nghe được…"
              className="w-full rounded-xl bg-night px-4 py-3 text-ivory outline-none"
            />
          </div>
        )}

        {revealed ? (
          <div className="mt-4 rounded-xl bg-night/40 p-4">
            <div className="flex items-center gap-2">
              {answers[answers.length - 1]?.correct ? (
                <Check className="text-success-text" />
              ) : (
                <X className="text-danger-text" />
              )}
              <span className="text-lg font-bold text-ivory">
                {current.term}
              </span>
              {current.reading ? (
                <span className="text-corgi-text">{current.reading}</span>
              ) : null}
            </div>
            <p className="mt-1 text-ivory/80">{current.meaningVi}</p>
            <p className="mt-1 text-sm text-ivory/60">{current.example}</p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          {!revealed ? (
            <button
              type="button"
              onClick={check}
              className="rounded-full bg-corgi px-6 py-2.5 font-medium text-night"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-corgi px-6 py-2.5 font-medium text-night"
            >
              {index + 1 >= queue.length ? "Xem kết quả" : "Tiếp theo"}
            </button>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel>
      <p className="text-sm text-ivory/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-corgi-text">{value}</p>
    </GlassPanel>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 rounded-full px-4 py-2 text-sm font-medium",
        active ? "bg-corgi text-night" : "glass text-ivory/80",
      )}
    >
      {children}
    </button>
  );
}
