import { describe, it, expect } from "vitest";
import { computeTopicStats, topWrongWords } from "./progress-insights";
import { createInitialProgress } from "@/services/srs/progress-factory";
import type { VocabularyItem, VocabularyProgress } from "@/types";

function item(id: string, topic: string, term: string): VocabularyItem {
  return {
    id,
    language: "en",
    term,
    meaningVi: `nghĩa ${term}`,
    example: "ex",
    exampleVi: "vd",
    level: "A1",
    topic,
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
  };
}

function prog(
  id: string,
  correct: number,
  incorrect: number,
): VocabularyProgress {
  return {
    ...createInitialProgress(id),
    correctCount: correct,
    incorrectCount: incorrect,
  };
}

const itemsById = new Map<string, VocabularyItem>([
  ["a", item("a", "Gia đình", "mother")],
  ["b", item("b", "Gia đình", "father")],
  ["c", item("c", "Số đếm", "one")],
]);

describe("computeTopicStats", () => {
  it("tính độ chính xác theo chủ đề, sắp theo accuracy giảm dần", () => {
    const list = [prog("a", 9, 1), prog("b", 8, 2), prog("c", 1, 4)];
    const stats = computeTopicStats(list, itemsById);
    expect(stats[0].topic).toBe("Gia đình"); // 17/20 = 85%
    expect(stats[0].accuracy).toBe(85);
    expect(stats[0].seen).toBe(2);
    expect(stats[1].topic).toBe("Số đếm"); // 1/5 = 20%
    expect(stats[1].accuracy).toBe(20);
  });

  it("bỏ qua mục không tra được item", () => {
    const stats = computeTopicStats([prog("zzz", 1, 0)], itemsById);
    expect(stats).toEqual([]);
  });
});

describe("topWrongWords", () => {
  it("trả về từ sai nhiều nhất theo thứ tự giảm dần", () => {
    const list = [prog("a", 1, 5), prog("b", 2, 2), prog("c", 3, 0)];
    const wrong = topWrongWords(list, itemsById, 5);
    expect(wrong.map((w) => w.id)).toEqual(["a", "b"]);
    expect(wrong[0].incorrectCount).toBe(5);
    expect(wrong[0].term).toBe("mother");
  });

  it("giới hạn số lượng", () => {
    const list = [prog("a", 0, 3), prog("b", 0, 2)];
    expect(topWrongWords(list, itemsById, 1)).toHaveLength(1);
  });
});
