import { describe, it, expect, beforeEach } from "vitest";
import { applyPracticeToProgress, recordPracticeResult } from "./practice";
import { createInitialProgress } from "@/services/srs/progress-factory";
import {
  getProgress,
  clearAllProgress,
} from "@/db/repositories/progress-repository";
import {
  getStatsForLanguage,
  clearAllStats,
} from "@/db/repositories/stats-repository";

const NOW = new Date("2026-07-18T00:00:00Z");

describe("applyPracticeToProgress", () => {
  it("câu đúng tăng correctCount và streak, new → learning", () => {
    const p = applyPracticeToProgress(createInitialProgress("x"), true, NOW);
    expect(p.correctCount).toBe(1);
    expect(p.streak).toBe(1);
    expect(p.state).toBe("learning");
    expect(p.incorrectCount).toBe(0);
  });

  it("câu sai tăng incorrectCount và đặt lại streak", () => {
    const base = { ...createInitialProgress("x"), streak: 3 };
    const p = applyPracticeToProgress(base, false, NOW);
    expect(p.incorrectCount).toBe(1);
    expect(p.streak).toBe(0);
  });

  it("không tự đánh dấu 'đã thuộc' và không đụng nextReviewAt", () => {
    const p = applyPracticeToProgress(createInitialProgress("x"), true, NOW);
    expect(p.state).not.toBe("mastered");
    expect(p.nextReviewAt).toBeUndefined();
  });

  it("đánh dấu từ yếu khi sai nếu bật markWeakOnWrong", () => {
    const p = applyPracticeToProgress(
      createInitialProgress("x"),
      false,
      NOW,
      true,
    );
    expect(p.markedWeak).toBe(true);
  });
});

describe("recordPracticeResult", () => {
  beforeEach(async () => {
    await clearAllProgress();
    await clearAllStats();
  });

  it("lưu tiến độ và daily stats", async () => {
    await recordPracticeResult({
      vocabularyId: "en-0001",
      language: "en",
      activityType: "quiz",
      correct: true,
      now: NOW,
    });
    const progress = await getProgress("en-0001");
    expect(progress?.correctCount).toBe(1);

    const stats = await getStatsForLanguage("en");
    expect(stats[0]?.wordsStudied).toBe(1);
    expect(stats[0]?.correct).toBe(1);
  });

  it("cộng dồn khi gọi nhiều lần", async () => {
    for (const correct of [true, false, true]) {
      await recordPracticeResult({
        vocabularyId: "en-0001",
        language: "en",
        activityType: "listening",
        correct,
        now: NOW,
      });
    }
    const progress = await getProgress("en-0001");
    expect(progress?.correctCount).toBe(2);
    expect(progress?.incorrectCount).toBe(1);
  });
});
