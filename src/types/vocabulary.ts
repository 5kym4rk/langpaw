export type LanguageCode = "en" | "zh" | "ko" | "ja";

export type ReviewStatus = "draft" | "reviewed" | "verified";

export interface VocabularySource {
  id: string;
  authority: string;
  title: string;
  url: string;
  license?: string;
  retrievedAt: string;
  sourceVersion?: string;
  usageNote?: string;
}

export type InterviewRole =
  | "rd-engineer"
  | "hardware-engineer"
  | "hardware-test-engineer"
  | "rf-engineer"
  | "embedded-firmware-engineer"
  | "network-telecom-engineer"
  | "qa-qc-engineer"
  | "process-engineer"
  | "production-engineer"
  | "maintenance-automation-engineer"
  | "technical-support-engineer";

export interface VocabularyItem {
  id: string;
  conceptId?: string;
  language: LanguageCode;

  term: string;
  alternateForms?: string[];
  reading?: string;
  romanization?: string;
  ipa?: string;

  partOfSpeech?: string;
  meaningVi: string;
  explanationVi?: string;

  example: string;
  exampleVi: string;

  level: string;
  syllabusVersion?: string;
  topic: string;
  tags: string[];

  isInterviewVocabulary: boolean;
  interviewRoles?: InterviewRole[];
  interviewQuestion?: string;
  interviewAnswerSample?: string;

  sourceIds: string[];
  /** URL trỏ tới entry cụ thể trong nguồn (không chỉ trang chủ từ điển). */
  sourceEntryUrl?: string;
  /** Mã entry trong nguồn gốc (vd ID trong WordNet/JMdict). */
  sourceEntryId?: string;
  /** Ngôn ngữ của định nghĩa gốc (nếu nghĩa dịch từ nguồn khác). */
  definitionSourceLanguage?: string;
  /** Đánh dấu câu ví dụ do dự án tự biên soạn (không trích từ nguồn). */
  exampleSelfAuthored?: boolean;

  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  verificationNote?: string;

  /** Lộ trình chứng chỉ — chỉ gán khi exact-match với certificate index (§cert). */
  certificateScheme?: CertificateScheme;
  /** Cấp hiển thị (vd "A1", "HSK 3", "N4", "A"); null/vắng = chưa phân loại. */
  certificateLevel?: string | null;
  certificateStatus?: CertificateStatus;
  /** Cần người rà soát (nhiều POS/reading mâu thuẫn…). */
  certificateRequiresReview?: boolean;

  /** ĐỦ điều kiện đưa vào phiên học của lộ trình (spec P0-II):
   *  nghĩa hợp lệ + có cấp + không cần rà soát + có cách đọc (zh/ja/ko). */
  learningReady?: boolean;
  /** Nghĩa trong từ điển là sense khác với sense của certificate index. */
  senseMismatch?: boolean;
  /** Nghĩa Việt không đủ chất lượng làm flashcard (chỉ nhãn POS, lỗi…). */
  invalidMeaning?: boolean;

  /** Chủ đề học theo taxonomy cố định (spec P1-V). */
  topicIds?: string[];
  topicStatus?: "source" | "rule" | "manual" | "unclassified";
  topicConfidence?: number;
}

export type CertificateScheme =
  "CEFR-J" | "HSK-3.0" | "JLPT-REFERENCE" | "NIKL-LEARNING";

export type CertificateStatus = "official" | "reference" | "unclassified";

/** Bản ghi gán chứng chỉ cho một từ (xuất ra assignments-<lang>.json). */
export interface CertificateAssignment {
  dictionaryItemId: string;
  routeId: string;
  scheme: CertificateScheme;
  sourceLevel: string;
  displayLevel: string;
  sourceId: string;
  sourceVersion: string;
  matchType: "lemma-pos" | "exact-term" | "term-reading" | "manual";
  status: "official" | "reference";
  confidence: number;
  requiresReview: boolean;
}

export interface VocabularyDataset {
  language: LanguageCode;
  level: string;
  topic?: string;
  syllabusVersion?: string;
  sources: VocabularySource[];
  items: VocabularyItem[];
}
