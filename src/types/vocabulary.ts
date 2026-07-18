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
}

export interface VocabularyDataset {
  language: LanguageCode;
  level: string;
  topic?: string;
  syllabusVersion?: string;
  sources: VocabularySource[];
  items: VocabularyItem[];
}
