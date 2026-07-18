import { describe, it, expect } from "vitest";
import { summarizeProgress } from "./stats";
import type { VocabularyProgress } from "@/types";

function p(over: Partial<VocabularyProgress>): VocabularyProgress {
  return {
    vocabularyId: "x",
    state: "new",
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    lapseCount: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    repetition: 0,
    favorite: false,
    markedWeak: false,
    ...over,
  };
}

describe("summarizeProgress", () => {
  const now = new Date("2026-07-18T10:00:00Z");

  it("đếm từ đã học, yếu, yêu thích và đến hạn", () => {
    const list = [
      p({ vocabularyId: "a", state: "new" }),
      p({ vocabularyId: "b", state: "learning", markedWeak: true }),
      p({ vocabularyId: "c", state: "review", favorite: true }),
      p({
        vocabularyId: "d",
        state: "review",
        nextReviewAt: "2026-07-18T09:00:00Z",
      }),
      p({
        vocabularyId: "e",
        state: "review",
        nextReviewAt: "2026-07-19T09:00:00Z",
      }),
    ];
    const summary = summarizeProgress(list, now);
    expect(summary.total).toBe(5);
    expect(summary.learned).toBe(4); // tất cả trừ "a"
    expect(summary.weak).toBe(1);
    expect(summary.favorite).toBe(1);
    expect(summary.due).toBe(1); // chỉ "d" đến hạn
  });

  it("trả về 0 cho danh sách rỗng", () => {
    expect(summarizeProgress([], now)).toEqual({
      total: 0,
      learned: 0,
      due: 0,
      weak: 0,
      favorite: 0,
    });
  });
});
