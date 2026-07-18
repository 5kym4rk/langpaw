import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { VocabularyItem } from "@/types";

function interviewItem(
  id: string,
  term: string,
  meaning: string,
): VocabularyItem {
  return {
    id,
    language: "en",
    term,
    meaningVi: meaning,
    example: `${term} example`,
    exampleVi: "vd",
    level: "Cơ bản",
    topic: "B. Điện tử cơ bản",
    tags: [],
    isInterviewVocabulary: true,
    interviewRoles: ["hardware-engineer"],
    sourceIds: ["s"],
    reviewStatus: "draft",
  };
}

let ITEMS: VocabularyItem[] = [];

vi.mock("@/services/data/vocabulary-loader", () => ({
  loadVocabulary: vi.fn(async () => ITEMS),
  loadSources: vi.fn(async () => []),
}));

import InterviewPage from "./InterviewPage";
import { useLearningStore } from "@/stores/learning-store";

function renderPage() {
  return render(
    <MemoryRouter>
      <InterviewPage />
    </MemoryRouter>,
  );
}

describe("InterviewPage — 3 tab (P1.8)", () => {
  beforeEach(() => {
    ITEMS = [
      interviewItem("iv-en-0001", "voltage", "điện áp"),
      interviewItem("iv-en-0002", "current", "dòng điện"),
    ];
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

  it("tab Thuật ngữ hiển thị danh sách và tìm kiếm lọc được", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("tab", { name: "Thuật ngữ" });
    // Cả hai thuật ngữ xuất hiện.
    const list = screen.getAllByRole("button", { name: /voltage|current/ });
    expect(list.length).toBeGreaterThanOrEqual(2);

    const search = screen.getByLabelText("Tìm kiếm thuật ngữ");
    await user.type(search, "volt");
    expect(
      screen.queryByRole("button", { name: /^current/ }),
    ).not.toBeInTheDocument();
  });

  it("tab Câu hỏi phỏng vấn hiển thị ngân hàng câu hỏi", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("tab", { name: "Câu hỏi phỏng vấn" }),
    );
    expect(
      screen.getByRole("heading", { name: "Could you introduce yourself?" }),
    ).toBeInTheDocument();
  });

  it("tab Luyện trả lời hiển thị nút bắt đầu và ghi âm cục bộ", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Luyện trả lời" }));
    expect(
      screen.getByRole("button", { name: /Bắt đầu \(chuẩn bị 30s\)/ }),
    ).toBeInTheDocument();
    // Không tải bản ghi lên máy chủ — ghi rõ trong UI.
    expect(screen.getByText(/không tải lên máy chủ/i)).toBeInTheDocument();
  });
});
