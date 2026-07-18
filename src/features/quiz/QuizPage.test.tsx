import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { VocabularyItem } from "@/types";

function makeItem(id: string, meaning: string): VocabularyItem {
  return {
    id,
    language: "en",
    term: id,
    meaningVi: meaning,
    example: `In a sentence ${id} appears.`,
    exampleVi: "vd",
    level: "A1",
    topic: "Chào hỏi",
    partOfSpeech: "noun",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
  };
}

let ITEMS: VocabularyItem[] = [];

vi.mock("@/services/data/vocabulary-loader", () => ({
  loadVocabulary: vi.fn(async () => ITEMS),
  loadSources: vi.fn(async () => []),
}));

import QuizPage from "./QuizPage";
import { useLearningStore } from "@/stores/learning-store";
import {
  clearAllProgress,
  getAllProgress,
} from "@/db/repositories/progress-repository";
import {
  clearAllStats,
  getStatsForLanguage,
} from "@/db/repositories/stats-repository";

function renderPage() {
  return render(
    <MemoryRouter>
      <QuizPage />
    </MemoryRouter>,
  );
}

describe("QuizPage — ghi tiến độ (P1.1)", () => {
  beforeEach(async () => {
    await clearAllProgress();
    await clearAllStats();
    useLearningStore.setState({
      language: null,
      allItems: [],
      sessionItems: [],
      currentIndex: 0,
      progressMap: new Map(),
      loading: false,
      error: null,
    });
  });

  it("mỗi câu trả lời ghi vào tiến độ và daily stats", async () => {
    ITEMS = [
      makeItem("en-0001", "con mèo"),
      makeItem("en-0002", "con chó"),
      makeItem("en-0003", "con chim"),
      makeItem("en-0004", "con cá"),
    ];
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("button", { name: "Bắt đầu kiểm tra" });
    // Tắt câu hỏi nghe để xác định, chọn 5 câu (chỉ có 4 từ → 4 câu).
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Bắt đầu kiểm tra" }));

    // Trả lời 4 câu.
    for (let i = 0; i < 4; i += 1) {
      await screen.findByText(/Câu \d+ \/ \d+/);
      const input = screen.queryByPlaceholderText("Nhập đáp án…");
      if (input) {
        await user.type(input, "guess");
      } else {
        // Chọn lựa chọn đầu tiên (nút không phải nút điều khiển).
        const choice = screen
          .getAllByRole("button")
          .find(
            (b) =>
              !["Kiểm tra", "Câu tiếp theo", "Xem kết quả", "Nghe"].includes(
                b.textContent?.trim() ?? "",
              ),
          );
        if (choice) await user.click(choice);
      }
      await user.click(screen.getByRole("button", { name: "Kiểm tra" }));
      await user.click(
        screen.getByRole("button", {
          name: i < 3 ? "Câu tiếp theo" : "Xem kết quả",
        }),
      );
    }

    await screen.findByRole("heading", { name: "Kết quả" });

    // Đã ghi tiến độ cho 4 mục và daily stats.
    const progress = await getAllProgress();
    expect(progress.length).toBe(4);
    const stats = await getStatsForLanguage("en");
    expect(stats[0]?.wordsStudied).toBe(4);
  });
});
