import { useEffect, useMemo, useState } from "react";
import { Volume2, Check, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { GlassPanel } from "@/components/common/GlassPanel";
import { EmptyState } from "@/components/common/EmptyState";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES } from "@/config/languages";
import { buildChoices } from "@/services/quiz/distractors";
import { shuffle } from "@/services/data/vocabulary-filters";
import { isAnswerCorrect } from "@/services/quiz/normalize-answer";
import { speechService } from "@/services/speech/speech-service";
import type { VocabularyItem } from "@/types";
import { cn } from "@/utils/cn";

type Mode = "choose" | "type";

export default function ListeningPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const speechEnabled = useSettingsStore((s) => s.settings.speechEnabled);
  const { allItems, loading, loadLanguage } = useLearningStore();
  const lang = LANGUAGES[targetLanguage];

  const [mode, setMode] = useState<Mode>("choose");
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<VocabularyItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  useEffect(() => () => speechService.cancel(), [targetLanguage]);

  const current = queue[index];
  const choices = useMemo(
    () => (current ? buildChoices(current, allItems, 4) : []),
    [current, allItems],
  );

  const playCurrent = (item: VocabularyItem) => {
    if (!speechEnabled) return;
    void speechService.speak(item.term, { lang: lang.speechLocale });
  };

  const begin = () => {
    const q = shuffle(allItems).slice(0, 10);
    setQueue(q);
    setIndex(0);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    setStarted(true);
    if (q[0]) setTimeout(() => playCurrent(q[0]), 300);
  };

  const check = () => {
    if (revealed || !current) return;
    if (mode === "choose" && !selected) return;
    setRevealed(true);
  };

  const goNext = () => {
    speechService.cancel();
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setStarted(false);
      return;
    }
    setIndex(nextIndex);
    setSelected(null);
    setTextAnswer("");
    setRevealed(false);
    setTimeout(() => playCurrent(queue[nextIndex]), 200);
  };

  if (loading) return <LoadingState label="Đang tải bộ từ…" />;

  if (!started) {
    return (
      <div>
        <PageHeader
          title="Luyện nghe"
          subtitle={`${lang.labelVi} · ${allItems.length} từ`}
        />
        <GlassPanel className="mx-auto max-w-md">
          <h2 className="mb-3 font-semibold">Chế độ</h2>
          <div className="mb-5 flex gap-2">
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
          {!speechEnabled ? (
            <p className="mb-4 text-sm text-danger">
              Phát âm đang tắt. Bật lại trong Cài đặt để luyện nghe.
            </p>
          ) : null}
          <button
            type="button"
            onClick={begin}
            disabled={allItems.length < 4 || !speechEnabled}
            className="w-full rounded-full bg-corgi px-5 py-2.5 font-medium text-night disabled:opacity-40"
          >
            Bắt đầu
          </button>
        </GlassPanel>
      </div>
    );
  }

  if (!current) {
    return (
      <EmptyState
        title="Đã hoàn thành"
        description="Bạn đã nghe hết phiên luyện tập."
        action={
          <button
            type="button"
            onClick={() => setStarted(false)}
            className="mt-2 rounded-full bg-corgi px-5 py-2 font-medium text-night"
          >
            Luyện lại
          </button>
        }
      />
    );
  }

  const typedCorrect =
    mode === "type" &&
    isAnswerCorrect(
      textAnswer,
      [current.term, ...(current.alternateForms ?? [])],
      current.language,
      {
        ignorePinyinTones: current.language === "zh",
      },
    );

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
            className="flex h-20 w-20 items-center justify-center rounded-full bg-corgi/25 text-corgi hover:bg-corgi/35"
          >
            <Volume2 size={36} />
          </button>
          <span className="text-sm text-ivory/50">Nhấn để nghe lại</span>
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
              className="w-full rounded-xl bg-night/60 px-4 py-3 text-ivory outline-none"
            />
          </div>
        )}

        {revealed ? (
          <div className="mt-4 rounded-xl bg-night/40 p-4">
            <div className="flex items-center gap-2">
              {(mode === "choose" ? selected === current.id : typedCorrect) ? (
                <Check className="text-success" />
              ) : (
                <X className="text-danger" />
              )}
              <span className="text-lg font-bold text-ivory">
                {current.term}
              </span>
              {current.reading ? (
                <span className="text-corgi">{current.reading}</span>
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
              {index + 1 >= queue.length ? "Hoàn thành" : "Tiếp theo"}
            </button>
          )}
        </div>
      </GlassPanel>
    </div>
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
