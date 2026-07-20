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
    labelVi: "Phân cấp theo HSK 3.0 / GF0025-2021",
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
    noteVi:
      "Tiêu chuẩn GF0025-2021; dữ liệu nhập từ bản chép cộng đồng. Từ không khớp: Ngoài HSK 3.0.",
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

/** Một mục vào ĐƯỢC lộ trình học khi learningReady (spec P0-II) — match
 *  mặt chữ đơn thuần chưa đủ. */
export function isCertified(item: VocabularyItem): boolean {
  return item.learningReady === true;
}

/** certificate = learningReady; dictionary = "Ngoài lộ trình" (phần còn lại,
 *  gồm cả mục đã khớp nhưng chờ rà soát). Kho từ điển ĐẦY ĐỦ là trang /library. */
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

// ---------------------------------------------------------------------------
// Lộ trình học đầy đủ (spec P1-VI): certificate + topic-route.
// ---------------------------------------------------------------------------

export interface LearningRoute {
  id: string;
  language: LanguageCode;
  labelVi: string;
  kind: "certificate" | "topic-route";
  certificateScheme?: CertificateScheme;
  requiredTopicIds?: string[];
  noteVi?: string;
  /** false = đã khai báo nhưng chưa có dữ liệu phân loại tương ứng. */
  enabled: boolean;
}

const T = (
  language: LanguageCode,
  id: string,
  labelVi: string,
  requiredTopicIds: string[],
  enabled = true,
  noteVi?: string,
): LearningRoute => ({
  id,
  language,
  labelVi,
  kind: "topic-route",
  requiredTopicIds,
  enabled,
  noteVi,
});

export const LEARNING_ROUTES: LearningRoute[] = [
  // — Tiếng Anh —
  {
    id: "en-cefr",
    language: "en",
    labelVi: CERT_ROUTES.en.labelVi,
    kind: "certificate",
    certificateScheme: "CEFR-J",
    enabled: true,
  },
  T("en", "en-giao-tiep", "Tiếng Anh giao tiếp", [
    "greetings",
    "communication",
    "daily-life",
    "feelings",
  ]),
  T("en", "en-cong-viec", "Tiếng Anh công việc", ["work", "job-interview"]),
  T(
    "en",
    "en-ielts",
    "IELTS tham khảo",
    [],
    false,
    "Chưa có dữ liệu phân loại IELTS.",
  ),
  T(
    "en",
    "en-toeic",
    "TOEIC tham khảo",
    [],
    false,
    "Chưa có dữ liệu phân loại TOEIC.",
  ),
  T("en", "en-dien-tu", "Điện tử – Viễn thông", [
    "electronics",
    "telecommunications",
  ]),
  // — Tiếng Trung —
  {
    id: "zh-hsk",
    language: "zh",
    labelVi: CERT_ROUTES.zh.labelVi,
    kind: "certificate",
    certificateScheme: "HSK-3.0",
    enabled: true,
  },
  T("zh", "zh-giao-tiep", "Tiếng Trung giao tiếp", [
    "greetings",
    "communication",
    "daily-life",
    "feelings",
  ]),
  T("zh", "zh-cong-viec", "Tiếng Trung công việc", ["work", "job-interview"]),
  T("zh", "zh-ky-thuat", "Tiếng Trung kỹ thuật", [
    "electronics",
    "telecommunications",
    "technology",
    "science",
  ]),
  // — Tiếng Nhật —
  {
    id: "ja-jlpt",
    language: "ja",
    labelVi: CERT_ROUTES.ja.labelVi,
    kind: "certificate",
    certificateScheme: "JLPT-REFERENCE",
    enabled: true,
  },
  T("ja", "ja-giao-tiep", "Tiếng Nhật giao tiếp", [
    "greetings",
    "communication",
    "daily-life",
    "feelings",
  ]),
  T("ja", "ja-cong-viec", "Tiếng Nhật công việc", ["work"]),
  T("ja", "ja-phong-van", "Phỏng vấn việc làm", ["job-interview"]),
  // — Tiếng Hàn —
  {
    id: "ko-nikl",
    language: "ko",
    labelVi: CERT_ROUTES.ko.labelVi,
    kind: "certificate",
    certificateScheme: "NIKL-LEARNING",
    enabled: true,
  },
  T("ko", "ko-giao-tiep", "Tiếng Hàn giao tiếp", [
    "greetings",
    "communication",
    "daily-life",
    "feelings",
  ]),
  T("ko", "ko-cong-viec", "Tiếng Hàn công việc", ["work", "job-interview"]),
];

export function routesForLanguage(language: LanguageCode): LearningRoute[] {
  return LEARNING_ROUTES.filter((r) => r.language === language);
}

/** Điều kiện vào lộ trình chủ đề: có chủ đề khớp + nghĩa/cách đọc hợp lệ. */
export function isTopicRouteEligible(
  item: VocabularyItem,
  requiredTopicIds: string[],
): boolean {
  if (item.invalidMeaning) return false;
  if (!item.topicIds?.some((t) => requiredTopicIds.includes(t))) return false;
  const needsReading =
    item.language === "zh" ||
    item.language === "ko" ||
    (item.language === "ja" && /[一-鿿]/.test(item.term));
  if (needsReading && !(item.reading || item.romanization)) return false;
  return true;
}
