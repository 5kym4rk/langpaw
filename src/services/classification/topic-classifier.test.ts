import { describe, it, expect } from "vitest";
import { classifyTopics } from "./topic-classifier";
import type { VocabularyItem } from "@/types";

function item(over: Partial<VocabularyItem>): VocabularyItem {
  return {
    id: "x",
    language: "en",
    term: "t",
    meaningVi: "n",
    example: "",
    exampleVi: "",
    level: "A1",
    topic: "Chưa phân loại chủ đề",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
    ...over,
  };
}

describe("classifyTopics", () => {
  it("chủ đề nguồn (semanticCategory Việt hóa) → status source", () => {
    const r = classifyTopics(item({ topic: "Ẩm thực" }));
    expect(r).toMatchObject({ topicIds: ["food"], topicStatus: "source" });
    expect(r.topicConfidence).toBeGreaterThanOrEqual(0.6);
  });

  it("từ khóa trong nghĩa Việt (không chỉ headword) → status rule", () => {
    const r = classifyTopics(
      item({ term: "voltage", meaningVi: "điện áp; hiệu điện thế của mạch" }),
    );
    expect(r.topicIds).toContain("electronics");
    expect(r.topicStatus).toBe("rule");
  });

  it("không đủ điểm → unclassified, topicIds rỗng", () => {
    const r = classifyTopics(
      item({ term: "zzz", meaningVi: "khái niệm trừu tượng" }),
    );
    expect(r.topicIds).toEqual([]);
    expect(r.topicStatus).toBe("unclassified");
  });

  it("tối đa 3 chủ đề", () => {
    const r = classifyTopics(
      item({
        meaningVi:
          "ăn cơm ở nhà hàng, mua bán ở cửa hàng, đi xe buýt tới trường học cùng giáo viên",
      }),
    );
    expect(r.topicIds.length).toBeLessThanOrEqual(3);
  });
});
