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
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface VocabularyDataset {
  language: LanguageCode;
  level: string;
  topic?: string;
  syllabusVersion?: string;
  sources: VocabularySource[];
  items: VocabularyItem[];
}
