import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

// Tránh timer/âm thanh của chế độ tự động trong test.
vi.mock("./useAutoLearn", () => ({
  useAutoLearn: () => ({
    status: "idle",
    index: 0,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
  }),
}));

import LearningPage from "./LearningPage";
import { useLearningStore } from "@/stores/learning-store";
import { clearAllProgress } from "@/db/repositories/progress-repository";
import { clearAllStats } from "@/db/repositories/stats-repository";

function renderPage() {
  return render(
    <MemoryRouter>
      <LearningPage />
    </MemoryRouter>,
  );
}

describe("LearningPage — hoàn thành phiên (P0.1)", () => {
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

  it("phiên 1 thẻ: đánh giá thẻ cuối chuyển sang màn hoàn thành", async () => {
    ITEMS = [makeItem("en-0001")];
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("button", { name: "Bắt đầu học" });
    await user.click(screen.getByRole("button", { name: "Bắt đầu học" }));

    await screen.findByText("en-0001");
    await user.click(screen.getByRole("button", { name: /Đã biết/ }));

    await screen.findByText("Hoàn thành phiên học 🎉");
    // Không còn thẻ đang chạy.
    expect(screen.queryByText("en-0001")).not.toBeInTheDocument();
  });

  it("double click trên thẻ cuối chỉ ghi một lần", async () => {
    ITEMS = [makeItem("en-0001")];
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("button", { name: "Bắt đầu học" });
    await user.click(screen.getByRole("button", { name: "Bắt đầu học" }));
    await screen.findByText("en-0001");

    const knownBtn = screen.getByRole("button", { name: /Đã biết/ });
    // Bắn hai click đồng bộ trước khi thao tác lưu hoàn tất.
    fireEvent.click(knownBtn);
    fireEvent.click(knownBtn);

    await screen.findByText("Hoàn thành phiên học 🎉");
    const progress = useLearningStore.getState().progressMap.get("en-0001");
    expect(progress?.correctCount).toBe(1);
  });

  it("phiên nhiều thẻ: hoàn thành sau khi đánh giá hết", async () => {
    ITEMS = [makeItem("en-0001"), makeItem("en-0002")];
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("button", { name: "Bắt đầu học" });
    await user.click(screen.getByRole("button", { name: "Bắt đầu học" }));

    await screen.findByText("en-0001");
    await user.click(screen.getByRole("button", { name: /Đã biết/ }));
    await screen.findByText("en-0002");
    await user.click(screen.getByRole("button", { name: /Chưa nhớ/ }));

    await screen.findByText("Hoàn thành phiên học 🎉");
    // 1 đã biết + 1 chưa nhớ.
    await waitFor(() => {
      expect(
        useLearningStore.getState().progressMap.get("en-0001")?.correctCount,
      ).toBe(1);
      expect(
        useLearningStore.getState().progressMap.get("en-0002")?.incorrectCount,
      ).toBe(1);
    });
    // Có nút học lại từ sai với 1 từ.
    expect(
      screen.getByRole("button", { name: /Học lại từ sai \(1\)/ }),
    ).toBeInTheDocument();
  });

  it("bỏ qua: không ghi đúng/sai, hiện nhóm Bỏ qua và nút học lại", async () => {
    ITEMS = [makeItem("en-0001"), makeItem("en-0002")];
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("button", { name: "Bắt đầu học" });
    await user.click(screen.getByRole("button", { name: "Bắt đầu học" }));

    // Thẻ đầu: bỏ qua → chuyển sang thẻ 2, chưa hoàn thành.
    await screen.findByText("en-0001");
    await user.click(
      screen.getByRole("button", { name: /Bỏ qua \(để lại cuối phiên\)/ }),
    );
    await screen.findByText("en-0002");
    expect(
      screen.queryByText("Hoàn thành phiên học 🎉"),
    ).not.toBeInTheDocument();

    // Đánh giá thẻ 2 → mọi thẻ đã được xử lý → hoàn thành.
    await user.click(screen.getByRole("button", { name: /Đã biết/ }));
    await screen.findByText("Hoàn thành phiên học 🎉");

    // Bỏ qua không ghi đúng/sai vào tiến độ en-0001.
    const p1 = useLearningStore.getState().progressMap.get("en-0001");
    expect(p1?.correctCount ?? 0).toBe(0);
    expect(p1?.incorrectCount ?? 0).toBe(0);

    // Kết quả có nút học lại thẻ bỏ qua với 1 thẻ.
    expect(
      screen.getByRole("button", { name: /Học thẻ bỏ qua \(1\)/ }),
    ).toBeInTheDocument();
  });
});
