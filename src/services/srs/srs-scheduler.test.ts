import { describe, it, expect } from "vitest";
import { schedule, previewGrades } from "./srs-scheduler";
import { createInitialProgress } from "./progress-factory";
import type { VocabularyProgress } from "@/types";

const NOW = new Date("2026-07-18T00:00:00Z");

function reviewed(over: Partial<VocabularyProgress>): VocabularyProgress {
  return { ...createInitialProgress("x"), ...over };
}

describe("schedule (SM-2 đơn giản)", () => {
  it("từ mới chọn Quên → 10 phút, state learning, lapse tăng", () => {
    const result = schedule(createInitialProgress("x"), "forgot", NOW);
    expect(result.nextReviewInMinutes).toBe(10);
    expect(result.progress.state).toBe("learning");
    expect(result.progress.lapseCount).toBe(1);
    expect(result.progress.intervalDays).toBe(0);
    expect(result.progress.repetition).toBe(0);
  });

  it("từ mới chọn Bình thường → interval 1 ngày", () => {
    const result = schedule(createInitialProgress("x"), "normal", NOW);
    expect(result.progress.intervalDays).toBe(1);
    expect(result.progress.repetition).toBe(1);
    expect(result.progress.state).toBe("review");
  });

  it("hai lần đúng liên tiếp → interval 3 ngày ở lần hai", () => {
    const first = schedule(createInitialProgress("x"), "normal", NOW).progress;
    const second = schedule(first, "normal", NOW).progress;
    expect(second.repetition).toBe(2);
    expect(second.intervalDays).toBe(3);
  });

  it("Dễ cho interval dài hơn Bình thường, Khó ngắn hơn", () => {
    const card = reviewed({ repetition: 2, intervalDays: 6, easeFactor: 2.5 });
    const easy = schedule(card, "easy", NOW).progress.intervalDays;
    const normal = schedule(card, "normal", NOW).progress.intervalDays;
    const hard = schedule(card, "hard", NOW).progress.intervalDays;
    expect(easy).toBeGreaterThan(normal);
    expect(hard).toBeLessThan(normal);
  });

  it("ease factor không bao giờ dưới 1.3", () => {
    let p = reviewed({ easeFactor: 1.35 });
    for (let i = 0; i < 5; i += 1) {
      p = schedule(p, "forgot", NOW).progress;
    }
    expect(p.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("nextReviewAt khớp thời gian giả lập", () => {
    const result = schedule(createInitialProgress("x"), "normal", NOW);
    const expected = new Date(NOW.getTime() + 24 * 60 * 60_000).toISOString();
    expect(result.progress.nextReviewAt).toBe(expected);
  });

  it("interval lớn + độ chính xác cao → mastered", () => {
    const card = reviewed({
      repetition: 8,
      intervalDays: 40,
      correctCount: 20,
      incorrectCount: 1,
      easeFactor: 2.6,
    });
    const result = schedule(card, "easy", NOW);
    expect(result.progress.intervalDays).toBeGreaterThanOrEqual(30);
    expect(result.progress.state).toBe("mastered");
  });
});

describe("previewGrades", () => {
  it("trả về nhãn cho đủ bốn mức", () => {
    const previews = previewGrades(createInitialProgress("x"), NOW);
    expect(previews.map((p) => p.grade)).toEqual([
      "forgot",
      "hard",
      "normal",
      "easy",
    ]);
    expect(previews[0].label).toBe("10 phút");
    expect(previews.find((p) => p.grade === "normal")?.label).toBe("1 ngày");
  });
});
