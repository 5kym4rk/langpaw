import { describe, it, expect } from "vitest";
import { filterLibrary } from "./library";
import { createInitialProgress } from "@/services/srs/progress-factory";
import type { VocabularyItem, VocabularyProgress } from "@/types";

function item(over: Partial<VocabularyItem>): VocabularyItem {
  return {
    id: over.id ?? "x",
    language: "en",
    term: over.term ?? "term",
    meaningVi: over.meaningVi ?? "nghĩa",
    example: "ex",
    exampleVi: "vd",
    level: "A1",
    topic: over.topic ?? "Chào hỏi",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
    ...over,
  };
}

function prog(id: string, o: Partial<VocabularyProgress>): VocabularyProgress {
  return { ...createInitialProgress(id), ...o };
}

const NOW = new Date("2026-07-18T00:00:00Z");
const items = [
  item({ id: "a", term: "voltage", meaningVi: "điện áp" }),
  item({ id: "b", term: "current", meaningVi: "dòng điện" }),
  item({ id: "c", term: "diode", meaningVi: "điốt" }),
];

describe("filterLibrary", () => {
  it("tìm theo từ khóa (term/nghĩa)", () => {
    const empty = new Map<string, VocabularyProgress>();
    expect(
      filterLibrary(items, empty, { query: "volt" }, NOW).map((i) => i.id),
    ).toEqual(["a"]);
    expect(
      filterLibrary(items, empty, { query: "dòng" }, NOW).map((i) => i.id),
    ).toEqual(["b"]);
  });

  it("lọc theo trạng thái favorite / weak", () => {
    const map = new Map<string, VocabularyProgress>([
      ["a", prog("a", { favorite: true })],
      ["b", prog("b", { markedWeak: true })],
    ]);
    expect(
      filterLibrary(items, map, { status: "favorite" }, NOW).map((i) => i.id),
    ).toEqual(["a"]);
    expect(
      filterLibrary(items, map, { status: "weak" }, NOW).map((i) => i.id),
    ).toEqual(["b"]);
  });

  it("lọc từ đến hạn", () => {
    const map = new Map<string, VocabularyProgress>([
      ["a", prog("a", { nextReviewAt: "2026-07-17T00:00:00Z" })],
      ["b", prog("b", { nextReviewAt: "2026-07-20T00:00:00Z" })],
    ]);
    expect(
      filterLibrary(items, map, { status: "due" }, NOW).map((i) => i.id),
    ).toEqual(["a"]);
  });

  it("kết hợp từ khóa và trạng thái", () => {
    const map = new Map<string, VocabularyProgress>([
      ["a", prog("a", { favorite: true })],
      ["c", prog("c", { favorite: true })],
    ]);
    expect(
      filterLibrary(items, map, { query: "di", status: "favorite" }, NOW).map(
        (i) => i.id,
      ),
    ).toEqual(["c"]);
  });
});
