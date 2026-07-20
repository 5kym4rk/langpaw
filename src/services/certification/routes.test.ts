import { describe, it, expect } from "vitest";
import {
  CERT_ROUTES,
  filterByRoute,
  levelOptions,
  topicOptions,
} from "./routes";
import type { VocabularyItem } from "@/types";

function item(over: Partial<VocabularyItem>): VocabularyItem {
  return {
    id: over.id ?? "x",
    language: "en",
    term: "t",
    meaningVi: "n",
    example: "",
    exampleVi: "",
    level: "A1",
    topic: "Chung",
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: ["s"],
    reviewStatus: "draft",
    ...over,
  };
}

describe("filterByRoute", () => {
  const items = [
    item({ id: "a", certificateStatus: "reference", certificateLevel: "A1" }),
    item({ id: "b", certificateStatus: "official", certificateLevel: "HSK 1" }),
    item({
      id: "c",
      certificateStatus: "unclassified",
      certificateLevel: null,
    }),
    item({ id: "d" }), // không có trường certificate → coi như chưa phân loại
  ];

  it("certificate = chỉ mục đã gán qua exact-match", () => {
    expect(filterByRoute(items, "certificate").map((i) => i.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("dictionary = phần chưa phân loại (vẫn trong kho)", () => {
    expect(filterByRoute(items, "dictionary").map((i) => i.id)).toEqual([
      "c",
      "d",
    ]);
  });
});

describe("levelOptions", () => {
  it("theo thứ tự chuẩn của scheme, chỉ cấp có từ, kèm số lượng", () => {
    const items = [
      item({ id: "1", certificateStatus: "reference", certificateLevel: "B1" }),
      item({ id: "2", certificateStatus: "reference", certificateLevel: "A1" }),
      item({ id: "3", certificateStatus: "reference", certificateLevel: "A1" }),
    ];
    expect(levelOptions(items, CERT_ROUTES.en)).toEqual([
      { value: "A1", count: 2 },
      { value: "B1", count: 1 },
    ]);
  });
});

describe("topicOptions", () => {
  it("chỉ chủ đề trong tập đã lọc, sắp giảm dần theo số lượng", () => {
    const items = [
      item({ id: "1", topic: "Đời sống" }),
      item({ id: "2", topic: "Đời sống" }),
      item({ id: "3", topic: "Công việc" }),
    ];
    expect(topicOptions(items)).toEqual([
      { value: "Đời sống", count: 2 },
      { value: "Công việc", count: 1 },
    ]);
  });
});
