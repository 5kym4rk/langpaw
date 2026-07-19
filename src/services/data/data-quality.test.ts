import { describe, it, expect } from "vitest";
import { computeQuality, qualityToCsv } from "./data-quality";
import type { ReviewStatus, VocabularyItem } from "@/types";

function item(over: Partial<VocabularyItem>): VocabularyItem {
  return {
    id: over.id ?? "x",
    language: "en",
    term: "term",
    meaningVi: "nghĩa",
    example: "ex",
    exampleVi: "vd",
    level: "A1",
    topic: "Chào hỏi",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: (over.reviewStatus ?? "draft") as ReviewStatus,
    ...over,
  };
}

describe("computeQuality", () => {
  it("đếm theo trạng thái và tính % verified", () => {
    const q = computeQuality([
      item({ id: "a", reviewStatus: "draft", reading: "r" }),
      item({ id: "b", reviewStatus: "reviewed", reading: "r" }),
      item({ id: "c", reviewStatus: "verified", reading: "r" }),
      item({ id: "d", reviewStatus: "verified", reading: "r" }),
    ]);
    expect(q.total).toBe(4);
    expect(q.draft).toBe(1);
    expect(q.reviewed).toBe(1);
    expect(q.verified).toBe(2);
    expect(q.verifiedPct).toBe(50);
  });

  it("đếm mục thiếu cách đọc và thiếu entry nguồn", () => {
    const q = computeQuality([
      item({ id: "a", reading: undefined, ipa: undefined }), // thiếu reading
      item({ id: "b", ipa: "/x/", sourceEntryUrl: "https://x.com/e" }),
    ]);
    expect(q.missingReading).toBe(1);
    expect(q.missingSourceEntry).toBe(1); // chỉ "a" thiếu entry
  });

  it("danh sách rỗng trả về 0", () => {
    const q = computeQuality([]);
    expect(q.total).toBe(0);
    expect(q.verifiedPct).toBe(0);
  });

  it("đếm thiếu reviewer/reviewedAt (chỉ với mục không phải draft) và self-authored", () => {
    const q = computeQuality([
      item({ id: "a", reviewStatus: "draft", exampleSelfAuthored: true }),
      item({ id: "b", reviewStatus: "reviewed" }), // thiếu reviewer + reviewedAt
      item({
        id: "c",
        reviewStatus: "verified",
        reviewedBy: "an",
        reviewedAt: "2026-01-01",
      }),
    ]);
    expect(q.missingReviewer).toBe(1); // chỉ "b"
    expect(q.missingReviewedAt).toBe(1);
    expect(q.selfAuthored).toBe(1);
  });

  it("qualityToCsv có header và một dòng mỗi ngôn ngữ", () => {
    const csv = qualityToCsv([
      { language: "en", q: computeQuality([item({ id: "a", reading: "r" })]) },
    ]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("language,total");
    expect(lines[1]).toMatch(/^en,1,/);
  });
});
