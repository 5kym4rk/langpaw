import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { VocabularyItem } from "@/types";

function makeItem(id: string): VocabularyItem {
  return {
    id,
    language: "en",
    term: id,
    meaningVi: `nghĩa ${id}`,
    example: `example ${id}`,
    exampleVi: "vd",
    level: "A1",
    topic: "Chào hỏi",
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

import ListeningPage from "./ListeningPage";
import { useLearningStore } from "@/stores/learning-store";
import { clearAllStats, getAllStats } from "@/db/repositories/stats-repository";

function renderPage() {
  return render(
    <MemoryRouter>
      <ListeningPage />
    </MemoryRouter>,
  );
}

describe("ListeningPage — màn kết quả (P0.2)", () => {
  beforeEach(async () => {
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

  it("hoàn thành phiên chuyển sang màn kết quả, không quay về setup", async () => {
    ITEMS = Array.from({ length: 5 }, (_, i) => makeItem(`en-000${i + 1}`));
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("button", { name: "Bắt đầu" });
    // Chọn chế độ nhập từ và 5 câu để test xác định.
    await user.click(screen.getByRole("button", { name: "Nghe → nhập từ" }));
    await user.click(screen.getByRole("button", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Bắt đầu" }));

    for (let i = 0; i < 5; i += 1) {
      const input = await screen.findByPlaceholderText(
        "Nhập từ bạn nghe được…",
      );
      await user.type(input, "zzz"); // luôn sai
      await user.click(screen.getByRole("button", { name: "Kiểm tra" }));
      const nextBtn = screen.getByRole("button", {
        name: i < 4 ? "Tiếp theo" : "Xem kết quả",
      });
      await user.click(nextBtn);
    }

    // Vào màn kết quả, không quay lại setup.
    await screen.findByText("Kết quả luyện nghe");
    expect(
      screen.queryByRole("button", { name: "Bắt đầu" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Từ nghe sai (5)")).toBeInTheDocument();

    // Có ghi thống kê học tập.
    const stats = await getAllStats();
    const en = stats.find((s) => s.language === "en");
    expect(en?.wordsStudied).toBe(5);
    expect(en?.incorrect).toBe(5);
  });
});
