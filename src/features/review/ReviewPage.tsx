import { useEffect, useMemo, useRef, useState } from "react";
import { PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { VocabularyCard } from "@/components/vocabulary/VocabularyCard";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { speechService } from "@/services/speech/speech-service";
import { buildReviewQueue } from "@/services/srs/review-queue";
import { previewGrades } from "@/services/srs/srs-scheduler";
import { createInitialProgress } from "@/services/srs/progress-factory";
import { REVIEW_GRADE_LABELS, type ReviewGrade } from "@/config/learning";
import { cn } from "@/utils/cn";

const GRADE_ORDER: ReviewGrade[] = ["forgot", "hard", "normal", "easy"];

const GRADE_STYLE: Record<ReviewGrade, string> = {
  forgot: "bg-danger/80 text-white",
  hard: "bg-amber-600/80 text-white",
  normal: "bg-sky-600/80 text-white",
  easy: "bg-success text-white",
};

export default function ReviewPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const { allItems, progressMap, loading, loadLanguage, review } =
    useLearningStore();

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [started, setStarted] = useState(false);
  const cardStartRef = useRef(0); // Mốc thời gian thẻ hiện tại (§3.6).

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  useEffect(() => () => speechService.cancel(), [targetLanguage]);

  // Xây dựng hàng đợi một lần khi bắt đầu (không đổi giữa chừng khi progress cập nhật).
  const buildQueue = () => {
    const queue = buildReviewQueue(allItems, progressMap);
    setQueueIds(queue.map((q) => q.item.id));
    setIndex(0);
    setFlipped(false);
    setStarted(true);
    cardStartRef.current = Date.now();
  };

  const currentItem = useMemo(() => {
    const id = queueIds[index];
    return allItems.find((i) => i.id === id);
  }, [queueIds, index, allItems]);

  const currentProgress = currentItem
    ? (progressMap.get(currentItem.id) ?? createInitialProgress(currentItem.id))
    : undefined;

  const previews = useMemo(
    () => (currentProgress ? previewGrades(currentProgress, new Date()) : []),
    [currentProgress],
  );

  const dueCount = useMemoQueueCount(started, queueIds.length);

  const grade = async (g: ReviewGrade) => {
    if (!currentItem) return;
    speechService.cancel();
    await review(currentItem.id, g, Date.now() - cardStartRef.current);
    setFlipped(false);
    setIndex((i) => i + 1);
    cardStartRef.current = Date.now();
  };

  if (loading) return <LoadingState label="Đang tải bộ từ…" />;

  if (!started) {
    const available = buildReviewQueue(allItems, progressMap).length;
    return (
      <div>
        <PageHeader title="Ôn tập" subtitle="Lặp lại ngắt quãng (SRS)" />
        {available === 0 ? (
          <EmptyState
            title="Chưa có từ cần ôn"
            description="Hãy học thêm từ mới. Các từ sẽ xuất hiện ở đây khi đến hạn ôn hoặc bị đánh dấu yếu."
            icon={<PartyPopper size={40} />}
          />
        ) : (
          <div className="glass mx-auto max-w-md rounded-xl2 p-6 text-center">
            <p className="mb-4 text-ivory/80">
              Có <span className="font-bold text-corgi-text">{available}</span>{" "}
              từ cần ôn hôm nay.
            </p>
            <button
              type="button"
              onClick={buildQueue}
              className="rounded-full bg-corgi px-6 py-2.5 font-medium text-night"
            >
              Bắt đầu ôn
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!currentItem) {
    return (
      <EmptyState
        title="Hoàn thành ôn tập 🎉"
        description={`Bạn đã ôn xong ${dueCount} từ. Quay lại sau khi có từ đến hạn tiếp theo.`}
        icon={<PartyPopper size={40} />}
        action={
          <button
            type="button"
            onClick={() => setStarted(false)}
            className="mt-2 rounded-full bg-corgi px-5 py-2 font-medium text-night"
          >
            Về đầu
          </button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Ôn tập"
        subtitle={`${index + 1} / ${queueIds.length}`}
      />
      <VocabularyCard
        item={currentItem}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {flipped ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADE_ORDER.map((g) => {
            const preview = previews.find((p) => p.grade === g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => void grade(g)}
                className={cn(
                  "flex flex-col items-center rounded-xl px-3 py-3 font-medium",
                  GRADE_STYLE[g],
                )}
              >
                <span>{REVIEW_GRADE_LABELS[g]}</span>
                <span className="mt-0.5 text-xs opacity-80">
                  {preview?.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-ivory/50">
          Lật thẻ để tự đánh giá mức độ nhớ.
        </p>
      )}
    </div>
  );
}

/** Giữ tổng số từ của phiên để hiển thị ở màn hoàn thành. */
function useMemoQueueCount(started: boolean, length: number): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (started && length > 0) setCount(length);
  }, [started, length]);
  return count;
}
