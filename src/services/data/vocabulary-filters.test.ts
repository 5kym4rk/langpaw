import { describe, it, expect } from "vitest";
import {
  filterVocabulary,
  shuffle,
  uniqueLevels,
  uniqueTopics,
} from "./vocabulary-filters";
import type { VocabularyItem, VocabularyProgress } from "@/types";

function makeItem(over: Partial<VocabularyItem>): VocabularyItem {
  return {
    id: "x",
    language: "en",
    term: "term",
    meaningVi: "nghĩa",
    example: "ex",
    exampleVi: "vd",
    level: "A1",
    topic: "Chào hỏi",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
    ...over,
  };
}

function makeProgress(over: Partial<VocabularyProgress>): VocabularyProgress {
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

const items: VocabularyItem[] = [
  makeItem({ id: "a", level: "A1", topic: "Chào hỏi" }),
  makeItem({ id: "b", level: "A2", topic: "Gia đình" }),
  makeItem({ id: "c", level: "A1", topic: "Gia đình" }),
];

describe("filterVocabulary", () => {
  const empty = new Map<string, VocabularyProgress>();

  it("lọc theo cấp độ", () => {
    const result = filterVocabulary(items, { level: "A1" }, empty);
    expect(result.map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("lọc theo chủ đề", () => {
    const result = filterVocabulary(items, { topic: "Gia đình" }, empty);
    expect(result.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("scope=new chỉ lấy từ mới hoặc chưa có tiến độ", () => {
    const map = new Map<string, VocabularyProgress>([
      ["a", makeProgress({ vocabularyId: "a", state: "review" })],
    ]);
    const result = filterVocabulary(items, { scope: "new" }, map);
    expect(result.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("scope=favorite chỉ lấy từ yêu thích", () => {
    const map = new Map<string, VocabularyProgress>([
      ["c", makeProgress({ vocabularyId: "c", favorite: true })],
    ]);
    const result = filterVocabulary(items, { scope: "favorite" }, map);
    expect(result.map((i) => i.id)).toEqual(["c"]);
  });
});

describe("shuffle", () => {
  it("giữ nguyên phần tử và không đổi mảng gốc", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, () => 0);
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("xác định với random cố định", () => {
    // random luôn trả 0: mỗi bước hoán đổi phần tử cuối với phần tử đầu.
    const result = shuffle([1, 2, 3], () => 0);
    expect(result).toEqual([2, 3, 1]);
  });
});

describe("unique helpers", () => {
  it("liệt kê cấp độ và chủ đề không trùng", () => {
    expect(uniqueLevels(items)).toEqual(["A1", "A2"]);
    expect(uniqueTopics(items)).toEqual(["Chào hỏi", "Gia đình"]);
  });
});
