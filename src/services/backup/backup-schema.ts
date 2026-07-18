import { z } from "zod";
import { languageCodeSchema } from "@/data/schema";

export const learningStateSchema = z.enum([
  "new",
  "learning",
  "review",
  "mastered",
]);

export const vocabularyProgressSchema = z.object({
  vocabularyId: z.string(),
  state: learningStateSchema,
  firstSeenAt: z.string().optional(),
  lastReviewedAt: z.string().optional(),
  nextReviewAt: z.string().optional(),
  correctCount: z.number(),
  incorrectCount: z.number(),
  streak: z.number(),
  lapseCount: z.number(),
  easeFactor: z.number(),
  intervalDays: z.number(),
  repetition: z.number(),
  favorite: z.boolean(),
  markedWeak: z.boolean(),
});

export const dailyStatSchema = z.object({
  date: z.string(),
  language: z.union([languageCodeSchema, z.literal("all")]),
  wordsStudied: z.number(),
  wordsLearned: z.number(),
  reviewsDone: z.number(),
  correct: z.number(),
  incorrect: z.number(),
  studyMs: z.number(),
});

// Thiết lập được validate lỏng (passthrough) để tương thích ngược khi thêm field.
export const userSettingsSchema = z
  .object({
    interfaceLanguage: z.literal("vi"),
    targetLanguage: languageCodeSchema,
  })
  .passthrough();

export const backupSchema = z.object({
  app: z.literal("LangPaw"),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  settings: userSettingsSchema,
  progress: z.array(vocabularyProgressSchema),
  dailyStats: z.array(dailyStatSchema).optional(),
});

export type BackupInput = z.infer<typeof backupSchema>;
