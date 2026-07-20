import { describe, it, expect } from "vitest";
import { buildLearningSession, diversifySession } from "./session-builder";
import type { VocabularyItem, VocabularyProgress } from "@/types";

function item(id: string, over: Partial<VocabularyItem> = {}): VocabularyItem {
  return {
    id,
    language: "en",
    term: id,
    meaningVi: "n",
    example: "",
    exampleVi: "",
    level: "A1",
    topic: "Khác",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
    learningReady: true,
    ...over,
  };
}

function prog(over: Partial<VocabularyProgress>): VocabularyProgress {
  return {
    vocabularyId: "x",
    state: "new",
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    favorite: false,
    markedWeak: false,
    ...over,
  } as VocabularyProgress;
}

const NOW = Date.parse("2026-07-20T10:00:00Z");

describe("buildLearningSession — ưu tiên SRS (spec P1-VII)", () => {
  it("đến hạn ôn > từ yếu > từ mới > đang học > đã học", () => {
    const items = [
      item("learned"),
      item("new-1"),
      item("weak-1"),
      item("due-1"),
      item("learning-1"),
    ];
    const pm = new Map<string, VocabularyProgress>([
      ["due-1", prog({ nextReviewAt: new Date(NOW - 1000).toISOString() })],
      ["weak-1", prog({ markedWeak: true, state: "learning" })],
      ["learning-1", prog({ state: "learning" })],
      ["learned", prog({ state: "mastered" })],
    ]);
    const out = buildLearningSession(items, pm, { size: 5, nowMs: NOW });
    expect(out.map((i) => i.id)).toEqual([
      "due-1",
      "weak-1",
      "new-1",
      "learning-1",
      "learned",
    ]);
  });

  it("shuffle chỉ xáo TRONG nhóm — từ đến hạn vẫn đứng trước từ mới", () => {
    const items = [item("new-a"), item("new-b"), item("due-a"), item("due-b")];
    const pm = new Map<string, VocabularyProgress>([
      ["due-a", prog({ nextReviewAt: new Date(NOW - 1).toISOString() })],
      ["due-b", prog({ nextReviewAt: new Date(NOW - 2).toISOString() })],
    ]);
    const out = buildLearningSession(items, pm, {
      size: 4,
      nowMs: NOW,
      shuffleWithinGroups: true,
      random: () => 0.99,
    });
    // 2 mục đầu luôn là nhóm đến hạn, 2 mục sau là nhóm mới.
    expect(
      out
        .slice(0, 2)
        .map((i) => i.id)
        .sort(),
    ).toEqual(["due-a", "due-b"]);
    expect(
      out
        .slice(2)
        .map((i) => i.id)
        .sort(),
    ).toEqual(["new-a", "new-b"]);
  });
});

describe("diversifySession", () => {
  it("không chọn hai sense cùng headword trong một phiên", () => {
    const out = diversifySession(
      [
        item("a1", { term: "bank" }),
        item("a2", { term: "bank" }),
        item("b", { term: "tree" }),
      ],
      3,
    );
    expect(out.map((i) => i.term).sort()).toEqual(["bank", "tree"]);
  });

  it("phân bố đều chủ đề (round-robin)", () => {
    const out = diversifySession(
      [
        item("f1", { topicIds: ["food"] }),
        item("f2", { term: "f2", topicIds: ["food"] }),
        item("w1", { term: "w1", topicIds: ["work"] }),
        item("w2", { term: "w2", topicIds: ["work"] }),
      ],
      4,
    );
    // Xen kẽ food/work thay vì 2 food liền nhau.
    expect(out[0].topicIds?.[0]).not.toBe(out[1].topicIds?.[0]);
  });
});
