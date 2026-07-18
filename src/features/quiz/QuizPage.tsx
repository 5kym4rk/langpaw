import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { GlassPanel } from "@/components/common/GlassPanel";
import { SpeechButton } from "@/components/vocabulary/SpeechButton";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES } from "@/config/languages";
import { generateQuiz, type QuizQuestion } from "@/services/quiz/quiz-engine";
import { isAnswerCorrect } from "@/services/quiz/normalize-answer";
import { recordPracticeResult } from "@/services/session/practice";
import { speechService } from "@/services/speech/speech-service";
import { cn } from "@/utils/cn";

type Phase = "setup" | "running" | "result";

interface AnswerRecord {
  question: QuizQuestion;
  correct: boolean;
  userAnswer: string;
}

const COUNTS = [5, 10, 20, 30] as const;

export default function QuizPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const { allItems, loading, loadLanguage, toggleWeak } = useLearningStore();
  const lang = LANGUAGES[targetLanguage];

  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState<number>(10);
  const [withAudio, setWithAudio] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const savingRef = useRef(false);
  const questionStartRef = useRef(0);

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  useEffect(() => () => speechService.cancel(), [targetLanguage]);

  const begin = () => {
    const quiz = generateQuiz(allItems, { count, withAudio });
    setQuestions(quiz);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    setStartedAt(Date.now());
    questionStartRef.current = Date.now();
    setPhase("running");
  };

  const q = questions[current];

  const submit = () => {
    // Chống double submit: revealed gate + cờ đang lưu.
    if (!q || revealed || savingRef.current) return;
    let correct = false;
    let userAnswer = "";
    if (q.choices) {
      if (!selected) return;
      correct = selected === q.correctChoiceId;
      userAnswer = q.choices.find((c) => c.id === selected)?.label ?? "";
    } else {
      userAnswer = textAnswer;
      correct = isAnswerCorrect(
        textAnswer,
        q.acceptedAnswers ?? [],
        q.item.language,
        {
          ignorePinyinTones: q.item.language === "zh",
        },
      );
    }
    savingRef.current = true;
    setAnswers((prev) => [...prev, { question: q, correct, userAnswer }]);
    setRevealed(true);
    void recordPracticeResult({
      vocabularyId: q.item.id,
      language: q.item.language,
      activityType: "quiz",
      correct,
      durationMs: Date.now() - questionStartRef.current,
    }).finally(() => {
      savingRef.current = false;
    });
  };

  const goNext = () => {
    speechService.cancel();
    if (current + 1 >= questions.length) {
      setPhase("result");
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    questionStartRef.current = Date.now();
  };

  if (loading) return <LoadingState label="Đang tải bộ từ…" />;

  if (phase === "setup") {
    return (
      <div>
        <PageHeader
          title="Kiểm tra"
          subtitle={`${lang.labelVi} · ${allItems.length} từ`}
        />
        <GlassPanel className="mx-auto max-w-md">
          <h2 className="mb-3 font-semibold">Số câu hỏi</h2>
          <div className="mb-4 flex gap-2">
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
          <label className="mb-5 flex items-center gap-2 text-sm text-ivory/80">
            <input
              type="checkbox"
              checked={withAudio}
              onChange={(e) => setWithAudio(e.target.checked)}
            />
            Bao gồm câu hỏi nghe
          </label>
          <button
            type="button"
            onClick={begin}
            disabled={allItems.length < 4}
            className="w-full rounded-full bg-corgi px-5 py-2.5 font-medium text-night disabled:opacity-40"
          >
            Bắt đầu kiểm tra
          </button>
        </GlassPanel>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <QuizResult
        answers={answers}
        startedAt={startedAt}
        onRestart={() => setPhase("setup")}
        onToggleWeak={toggleWeak}
      />
    );
  }

  // running
  if (!q) return null;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Kiểm tra"
        subtitle={`Câu ${current + 1} / ${questions.length}`}
      />
      <GlassPanel strong>
        <p className="mb-1 text-xs uppercase tracking-wide text-ivory/40">
          {questionTypeLabel(q.type)}
        </p>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-ivory">{q.prompt}</h2>
          {q.audioText ? (
            <SpeechButton
              text={q.audioText}
              locale={lang.speechLocale}
              label="Nghe"
            />
          ) : null}
        </div>

        {q.choices ? (
          <div className="grid gap-2">
            {q.choices.map((choice) => {
              const isCorrect = choice.id === q.correctChoiceId;
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
                    revealed &&
                      !isCorrect &&
                      !isPicked &&
                      "border-ivory/10 opacity-60",
                  )}
                >
                  {choice.label}
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
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Nhập đáp án…"
              className="w-full rounded-xl bg-night/60 px-4 py-3 text-ivory outline-none"
            />
            {revealed ? (
              <p className="mt-2 text-sm">
                Đáp án đúng:{" "}
                <span className="font-semibold text-success">
                  {q.item.term}
                </span>
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          {!revealed ? (
            <button
              type="button"
              onClick={submit}
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
              {current + 1 >= questions.length
                ? "Xem kết quả"
                : "Câu tiếp theo"}
            </button>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function QuizResult({
  answers,
  startedAt,
  onRestart,
  onToggleWeak,
}: {
  answers: AnswerRecord[];
  startedAt: number;
  onRestart: () => void;
  onToggleWeak: (id: string) => Promise<void>;
}) {
  const correct = answers.filter((a) => a.correct).length;
  const wrong = answers.filter((a) => !a.correct);
  const seconds = useMemo(
    () => Math.round((Date.now() - startedAt) / 1000),
    [startedAt],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Kết quả" />
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassPanel>
          <p className="text-sm text-ivory/60">Điểm</p>
          <p className="text-3xl font-bold text-corgi">
            {answers.length ? Math.round((correct / answers.length) * 100) : 0}%
          </p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-sm text-ivory/60">Đúng / Sai</p>
          <p className="text-3xl font-bold text-ivory">
            <span className="text-success">{correct}</span> /{" "}
            <span className="text-danger">{wrong.length}</span>
          </p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-sm text-ivory/60">Thời gian</p>
          <p className="text-3xl font-bold text-ivory">{seconds}s</p>
        </GlassPanel>
      </div>

      {wrong.length > 0 ? (
        <GlassPanel className="mt-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle size={18} /> Câu sai ({wrong.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {wrong.map((a) => (
              <li
                key={a.question.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-night/40 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-ivory">
                    {a.question.item.term}
                  </p>
                  <p className="text-sm text-ivory/60">
                    {a.question.item.meaningVi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onToggleWeak(a.question.item.id)}
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
          <p className="flex items-center justify-center gap-2 text-success">
            <Check /> Tuyệt vời! Bạn trả lời đúng tất cả.
          </p>
        </GlassPanel>
      )}

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-2 rounded-full bg-corgi px-6 py-2.5 font-medium text-night"
        >
          <RotateCcw size={18} /> Làm bài mới
        </button>
      </div>
    </div>
  );
}

function questionTypeLabel(type: QuizQuestion["type"]): string {
  const map: Record<QuizQuestion["type"], string> = {
    "meaning-choice": "Chọn nghĩa",
    "word-choice": "Chọn từ",
    "reading-choice": "Chọn cách đọc",
    "listen-choice": "Nghe và chọn",
    "fill-blank": "Điền vào chỗ trống",
    "type-word": "Nhập từ",
  };
  return map[type];
}
