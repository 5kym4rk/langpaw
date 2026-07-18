import { describe, it, expect } from "vitest";
import { buildReviewQueue } from "./review-queue";
import { createInitialProgress } from "./progress-factory";
import type { VocabularyItem, VocabularyProgress } from "@/types";

const NOW = new Date("2026-07-18T00:00:00Z");

function item(id: string): VocabularyItem {
  return {
    id,
    language: "en",
    term: id,
    meaningVi: "nghĩa",
    example: "ex",
    exampleVi: "vd",
    level: "A1",
    topic: "Chào hỏi",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
  };
}

function prog(
  id: string,
  over: Partial<VocabularyProgress>,
): VocabularyProgress {
  return { ...createInitialProgress(id), ...over };
}

describe("buildReviewQueue", () => {
  const items = [item("a"), item("b"), item("c"), item("d")];

  it("chỉ gồm từ đã học có lý do ôn", () => {
    const map = new Map<string, VocabularyProgress>([
      ["a", prog("a", { nextReviewAt: "2026-07-17T00:00:00Z" })], // đến hạn
      ["b", prog("b", { markedWeak: true })],
      ["c", prog("c", { incorrectCount: 2 })],
      // d chưa học
    ]);
    const queue = buildReviewQueue(items, map, NOW);
    expect(queue.map((q) => q.item.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("ưu tiên từ đến hạn lên đầu", () => {
    const map = new Map<string, VocabularyProgress>([
      ["a", prog("a", { markedWeak: true })],
      ["b", prog("b", { nextReviewAt: "2026-07-10T00:00:00Z" })], // đến hạn
    ]);
    const queue = buildReviewQueue(items, map, NOW);
    expect(queue[0].item.id).toBe("b");
  });

  it("bỏ qua từ chưa đến hạn và không có dấu hiệu yếu", () => {
    const map = new Map<string, VocabularyProgress>([
      [
        "a",
        prog("a", { nextReviewAt: "2026-07-20T00:00:00Z", state: "review" }),
      ],
    ]);
    const queue = buildReviewQueue(items, map, NOW);
    expect(queue).toHaveLength(0);
  });
});
