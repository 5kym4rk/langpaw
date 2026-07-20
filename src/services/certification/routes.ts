import type { CertificateScheme, LanguageCode, VocabularyItem } from "@/types";

/**
 * Lộ trình chứng chỉ theo ngôn ngữ (spec phân loại chứng chỉ). Menu cấp độ và
 * chủ đề được tính từ tập từ ĐÃ GÁN qua exact-match với certificate index —
 * không sinh trực tiếp từ uniqueLevels/uniqueTopics của toàn kho.
 */

export type RouteKind = "certificate" | "dictionary";

export interface RouteMeta {
  routeId: string;
  scheme: CertificateScheme;
  labelVi: string;
  /** official = index chính thức; reference = danh sách tham khảo. */
  status: "official" | "reference";
  /** Thứ tự cấp hiển thị. */
  levelOrder: string[];
  noteVi?: string;
}

export const CERT_ROUTES: Record<LanguageCode, RouteMeta> = {
  en: {
    routeId: "cefr-reference",
    scheme: "CEFR-J",
    labelVi: "CEFR tham khảo",
    status: "reference",
    levelOrder: ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"],
    noteVi: "Phân cấp tham khảo theo CEFR (CEFR-J + Octanove).",
  },
  zh: {
    routeId: "hsk-3.0",
    scheme: "HSK-3.0",
    labelVi: "HSK 3.0 chính thức",
    status: "official",
    levelOrder: [
      "HSK 1",
      "HSK 2",
      "HSK 3",
      "HSK 4",
      "HSK 5",
      "HSK 6",
      "HSK 7–9",
    ],
    noteVi: "Theo GF0025-2021. Từ không khớp: Ngoài HSK 3.0.",
  },
  ja: {
    routeId: "jlpt-reference",
    scheme: "JLPT-REFERENCE",
    labelVi: "JLPT tham khảo",
    status: "reference",
    levelOrder: ["N5", "N4", "N3", "N2", "N1"],
    noteVi: "JLPT không công bố danh sách từ chính thức.",
  },
  ko: {
    routeId: "nikl-learning",
    scheme: "NIKL-LEARNING",
    labelVi: "Từ vựng học tiếng Hàn NIKL",
    status: "reference",
    levelOrder: ["A", "B", "C"],
    noteVi: "Phân cấp NIKL (초급/중급/고급 → A/B/C), không quy đổi TOPIK.",
  },
};

/** Một mục thuộc lộ trình chứng chỉ khi đã được gán qua exact-match. */
export function isCertified(item: VocabularyItem): boolean {
  return (
    item.certificateStatus === "official" ||
    item.certificateStatus === "reference"
  );
}

/** Lọc theo lộ trình: certificate = đã gán cấp; dictionary = chưa phân loại. */
export function filterByRoute(
  items: VocabularyItem[],
  kind: RouteKind,
): VocabularyItem[] {
  return items.filter((i) => (kind === "certificate") === isCertified(i));
}

export interface CountedOption {
  value: string;
  count: number;
}

/** Danh sách cấp độ (kèm số từ) của lộ trình, theo thứ tự chuẩn của scheme. */
export function levelOptions(
  certItems: VocabularyItem[],
  meta: RouteMeta,
): CountedOption[] {
  const counts = new Map<string, number>();
  for (const i of certItems) {
    if (!i.certificateLevel) continue;
    counts.set(i.certificateLevel, (counts.get(i.certificateLevel) ?? 0) + 1);
  }
  return meta.levelOrder
    .filter((l) => counts.has(l))
    .map((l) => ({ value: l, count: counts.get(l)! }));
}

/** Danh sách chủ đề (kèm số từ) trong tập đã lọc theo route + level. */
export function topicOptions(items: VocabularyItem[]): CountedOption[] {
  const counts = new Map<string, number>();
  for (const i of items) {
    counts.set(i.topic, (counts.get(i.topic) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
