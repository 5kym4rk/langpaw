import type { VocabularyItem, VocabularyProgress } from "@/types";

export interface TopicStat {
  topic: string;
  correct: number;
  incorrect: number;
  seen: number;
  accuracy: number;
}

export interface WrongWord {
  id: string;
  term: string;
  meaningVi: string;
  incorrectCount: number;
}

/**
 * Tính độ chính xác theo chủ đề. Pure function. Chỉ tính các mục đã có tiến độ
 * và tra được item tương ứng.
 */
export function computeTopicStats(
  progressList: VocabularyProgress[],
  itemsById: Map<string, VocabularyItem>,
): TopicStat[] {
  const byTopic = new Map<
    string,
    { correct: number; incorrect: number; seen: number }
  >();
  for (const p of progressList) {
    const item = itemsById.get(p.vocabularyId);
    if (!item) continue;
    const entry = byTopic.get(item.topic) ?? {
      correct: 0,
      incorrect: 0,
      seen: 0,
    };
    entry.correct += p.correctCount;
    entry.incorrect += p.incorrectCount;
    entry.seen += 1;
    byTopic.set(item.topic, entry);
  }
  return Array.from(byTopic.entries())
    .map(([topic, e]) => {
      const total = e.correct + e.incorrect;
      return {
        topic,
        correct: e.correct,
        incorrect: e.incorrect,
        seen: e.seen,
        accuracy: total > 0 ? Math.round((e.correct / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Danh sách từ sai nhiều nhất (incorrectCount > 0), sắp xếp giảm dần. Pure.
 */
export function topWrongWords(
  progressList: VocabularyProgress[],
  itemsById: Map<string, VocabularyItem>,
  limit = 5,
): WrongWord[] {
  return progressList
    .filter((p) => p.incorrectCount > 0)
    .map((p) => {
      const item = itemsById.get(p.vocabularyId);
      return item
        ? {
            id: p.vocabularyId,
            term: item.term,
            meaningVi: item.meaningVi,
            incorrectCount: p.incorrectCount,
          }
        : null;
    })
    .filter((w): w is WrongWord => w !== null)
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, limit);
}
