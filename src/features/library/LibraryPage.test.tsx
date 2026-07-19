import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { VocabularyItem } from "@/types";

function makeItem(id: string, term: string, meaning: string): VocabularyItem {
  return {
    id,
    language: "en",
    term,
    meaningVi: meaning,
    example: "ex",
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

import LibraryPage from "./LibraryPage";
import { useLearningStore } from "@/stores/learning-store";

function renderPage() {
  return render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  );
}

describe("LibraryPage — kho từ (P2.2/P2.3)", () => {
  beforeEach(() => {
    ITEMS = [
      makeItem("en-0001", "voltage", "điện áp"),
      makeItem("en-0002", "current", "dòng điện"),
    ];
    useLearningStore.setState({
      language: null,
      allItems: [],
      sessionItems: [],
      currentIndex: 0,
      progressMap: new Map(),
      loading: false,
      error: null,
      pendingRun: false,
    });
  });

  it("tìm kiếm lọc danh sách", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("voltage");
    expect(screen.getByText("current")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Tìm kiếm trong kho từ"), "điện áp");
    expect(screen.queryByText("current")).not.toBeInTheDocument();
    expect(screen.getByText("voltage")).toBeInTheDocument();
  });

  it("nút Học các từ này xếp phiên từ danh sách đang lọc", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("voltage");
    await user.click(screen.getByRole("button", { name: /Học các từ này/ }));

    const state = useLearningStore.getState();
    expect(state.pendingRun).toBe(true);
    expect(state.sessionItems.map((i) => i.id)).toEqual(["en-0001", "en-0002"]);
  });
});
