import { describe, it, expect } from "vitest";
import { generateQuiz } from "./quiz-engine";
import { pickDistractors, buildChoices } from "./distractors";
import type { VocabularyItem } from "@/types";

function item(over: Partial<VocabularyItem>): VocabularyItem {
  return {
    id: over.id ?? "x",
    language: "en",
    term: over.term ?? "term",
    reading: over.reading,
    meaningVi: over.meaningVi ?? "nghĩa",
    example: over.example ?? "This is a term here.",
    exampleVi: "vd",
    level: over.level ?? "A1",
    topic: over.topic ?? "Chào hỏi",
    partOfSpeech: over.partOfSpeech ?? "noun",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
    ...over,
  };
}

const pool: VocabularyItem[] = [
  item({
    id: "a",
    term: "cat",
    meaningVi: "con mèo",
    partOfSpeech: "noun",
    level: "A1",
  }),
  item({
    id: "b",
    term: "dog",
    meaningVi: "con chó",
    partOfSpeech: "noun",
    level: "A1",
  }),
  item({
    id: "c",
    term: "run",
    meaningVi: "chạy",
    partOfSpeech: "verb",
    level: "A2",
  }),
  item({
    id: "d",
    term: "bird",
    meaningVi: "con chim",
    partOfSpeech: "noun",
    level: "A1",
  }),
  item({
    id: "e",
    term: "fish",
    meaningVi: "con cá",
    partOfSpeech: "noun",
    level: "A1",
  }),
];

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("pickDistractors", () => {
  it("không chứa đáp án đúng và không trùng nghĩa", () => {
    const correct = pool[0];
    const result = pickDistractors(correct, pool, 3, seq([0.1, 0.5, 0.9]));
    expect(result.map((r) => r.id)).not.toContain("a");
    expect(result.every((r) => r.meaningVi !== correct.meaningVi)).toBe(true);
  });

  it("ưu tiên cùng loại từ và cấp độ", () => {
    const correct = pool[0]; // noun, A1
    const result = pickDistractors(correct, pool, 2, () => 0);
    // "c" là verb A2 nên xếp cuối; hai mục đầu phải là noun.
    expect(result.every((r) => r.partOfSpeech === "noun")).toBe(true);
  });
});

describe("buildChoices", () => {
  it("gồm đáp án đúng và không trùng id", () => {
    const choices = buildChoices(pool[0], pool, 4, () => 0);
    const ids = choices.map((c) => c.id);
    expect(ids).toContain("a");
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("generateQuiz", () => {
  it("tạo đúng số câu và mỗi câu có đáp án đúng hợp lệ", () => {
    const quiz = generateQuiz(pool, { count: 4, random: () => 0 });
    expect(quiz).toHaveLength(4);
    for (const q of quiz) {
      if (q.choices) {
        expect(q.choices.some((c) => c.id === q.correctChoiceId)).toBe(true);
      } else {
        expect(q.acceptedAnswers && q.acceptedAnswers.length).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it("loại dạng nghe khi không bật âm thanh", () => {
    const quiz = generateQuiz(pool, {
      count: 5,
      types: ["listen-choice", "meaning-choice"],
      withAudio: false,
      random: () => 0,
    });
    expect(quiz.every((q) => q.type !== "listen-choice")).toBe(true);
  });

  it("fill-blank thay thế term bằng chỗ trống", () => {
    const one = [
      item({ id: "z", term: "apple", example: "I eat an apple daily." }),
    ];
    const quiz = generateQuiz(one, {
      count: 1,
      types: ["fill-blank"],
      random: () => 0,
    });
    expect(quiz[0].prompt).toContain("_____");
    expect(quiz[0].prompt).not.toContain("apple");
    expect(quiz[0].acceptedAnswers).toContain("apple");
  });
});
