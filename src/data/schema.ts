import { z } from "zod";

export const languageCodeSchema = z.enum(["en", "zh", "ko", "ja"]);

export const reviewStatusSchema = z.enum(["draft", "reviewed", "verified"]);

export const interviewRoleSchema = z.enum([
  "rd-engineer",
  "hardware-engineer",
  "hardware-test-engineer",
  "rf-engineer",
  "embedded-firmware-engineer",
  "network-telecom-engineer",
  "qa-qc-engineer",
  "process-engineer",
  "production-engineer",
  "maintenance-automation-engineer",
  "technical-support-engineer",
]);

export const vocabularySourceSchema = z.object({
  id: z.string().min(1),
  authority: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().or(z.literal("")),
  license: z.string().optional(),
  retrievedAt: z.string().min(1),
  sourceVersion: z.string().optional(),
  usageNote: z.string().optional(),
});

export const vocabularyItemSchema = z
  .object({
    id: z.string().min(1),
    conceptId: z.string().optional(),
    language: languageCodeSchema,

    term: z.string().min(1),
    alternateForms: z.array(z.string()).optional(),
    reading: z.string().optional(),
    romanization: z.string().optional(),
    ipa: z.string().optional(),

    partOfSpeech: z.string().optional(),
    meaningVi: z.string().min(1),
    explanationVi: z.string().optional(),

    example: z.string().min(1),
    exampleVi: z.string().min(1),

    level: z.string().min(1),
    syllabusVersion: z.string().optional(),
    topic: z.string().min(1),
    tags: z.array(z.string()),

    isInterviewVocabulary: z.boolean(),
    interviewRoles: z.array(interviewRoleSchema).optional(),
    interviewQuestion: z.string().optional(),
    interviewAnswerSample: z.string().optional(),

    sourceIds: z.array(z.string().min(1)).min(1),
    sourceEntryUrl: z.string().url().optional(),
    sourceEntryId: z.string().optional(),
    definitionSourceLanguage: z.string().optional(),
    exampleSelfAuthored: z.boolean().optional(),
    reviewStatus: reviewStatusSchema,
    reviewedBy: z.string().optional(),
    reviewedAt: z.string().optional(),
    verificationNote: z.string().optional(),
  })
  .refine(
    (item) =>
      !item.isInterviewVocabulary ||
      (item.interviewRoles && item.interviewRoles.length > 0),
    {
      message: "Từ phỏng vấn phải có ít nhất một interviewRole",
      path: ["interviewRoles"],
    },
  )
  .refine(
    (item) =>
      item.reviewStatus !== "verified" ||
      (Boolean(item.reviewedBy) && Boolean(item.reviewedAt)),
    {
      message: "reviewStatus=verified phải có reviewedBy và reviewedAt",
      path: ["reviewStatus"],
    },
  );

export const vocabularyDatasetSchema = z.object({
  language: languageCodeSchema,
  level: z.string().min(1),
  topic: z.string().optional(),
  syllabusVersion: z.string().optional(),
  sources: z.array(vocabularySourceSchema),
  items: z.array(vocabularyItemSchema),
});

export type VocabularyDatasetInput = z.infer<typeof vocabularyDatasetSchema>;
