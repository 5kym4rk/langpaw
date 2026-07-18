import { create } from "zustand";
import type { LanguageCode, VocabularyItem, VocabularyProgress } from "@/types";
import { loadVocabulary } from "@/services/data/vocabulary-loader";
import {
  filterVocabulary,
  shuffle,
  type VocabularyFilter,
} from "@/services/data/vocabulary-filters";
import {
  getProgressMap,
  getOrCreateProgress,
  saveProgress,
} from "@/db/repositories/progress-repository";
import { recordActivity } from "@/db/repositories/stats-repository";
import { schedule } from "@/services/srs/srs-scheduler";
import type { ReviewGrade } from "@/config/learning";

export interface SessionOptions extends VocabularyFilter {
  shuffleOrder?: boolean;
  /** Giới hạn số thẻ trong phiên; bỏ qua để lấy tất cả sau lọc. */
  sessionSize?: number;
}

interface LearningState {
  language: LanguageCode | null;
  allItems: VocabularyItem[];
  sessionItems: VocabularyItem[];
  currentIndex: number;
  progressMap: Map<string, VocabularyProgress>;
  loading: boolean;
  error: string | null;

  loadLanguage: (language: LanguageCode) => Promise<void>;
  startSession: (options: SessionOptions) => void;
  startSessionFromIds: (ids: string[]) => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  markKnown: (id: string) => Promise<void>;
  markUnknown: (id: string) => Promise<void>;
  review: (id: string, grade: ReviewGrade) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleWeak: (id: string) => Promise<void>;
}

async function mutateProgress(
  get: () => LearningState,
  set: (partial: Partial<LearningState>) => void,
  id: string,
  mutate: (p: VocabularyProgress) => VocabularyProgress,
): Promise<void> {
  const current = await getOrCreateProgress(id);
  const updated = mutate({ ...current });
  await saveProgress(updated);
  const nextMap = new Map(get().progressMap);
  nextMap.set(id, updated);
  set({ progressMap: nextMap });
}

const nowIso = () => new Date().toISOString();

export const useLearningStore = create<LearningState>((set, get) => ({
  language: null,
  allItems: [],
  sessionItems: [],
  currentIndex: 0,
  progressMap: new Map(),
  loading: false,
  error: null,

  loadLanguage: async (language) => {
    if (get().language === language && get().allItems.length > 0) return;
    set({ loading: true, error: null });
    try {
      const [items, progressMap] = await Promise.all([
        loadVocabulary(language),
        getProgressMap(),
      ]);
      set({
        language,
        allItems: items,
        progressMap,
        sessionItems: [],
        currentIndex: 0,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi tải bộ từ:", error);
      set({ loading: false, error: "Không tải được bộ từ." });
    }
  },

  startSession: (options) => {
    const { allItems, progressMap } = get();
    const filtered = filterVocabulary(allItems, options, progressMap);
    const ordered = options.shuffleOrder ? shuffle(filtered) : filtered;
    const items =
      options.sessionSize && options.sessionSize > 0
        ? ordered.slice(0, options.sessionSize)
        : ordered;
    set({ sessionItems: items, currentIndex: 0 });
  },

  startSessionFromIds: (ids) => {
    const { allItems } = get();
    const byId = new Map(allItems.map((i) => [i.id, i]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((i): i is VocabularyItem => Boolean(i));
    set({ sessionItems: items, currentIndex: 0 });
  },

  next: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.sessionItems.length - 1),
    })),

  previous: () =>
    set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  goTo: (index) =>
    set((s) => ({
      currentIndex: Math.min(Math.max(index, 0), s.sessionItems.length - 1),
    })),

  markKnown: async (id) => {
    await mutateProgress(get, set, id, (p) => ({
      ...p,
      firstSeenAt: p.firstSeenAt ?? nowIso(),
      lastReviewedAt: nowIso(),
      correctCount: p.correctCount + 1,
      streak: p.streak + 1,
      state: p.state === "new" ? "learning" : p.state,
    }));
    const lang = get().language;
    if (lang) {
      await recordActivity(lang, {
        wordsStudied: 1,
        wordsLearned: 1,
        correct: 1,
      });
    }
  },

  markUnknown: async (id) => {
    await mutateProgress(get, set, id, (p) => ({
      ...p,
      firstSeenAt: p.firstSeenAt ?? nowIso(),
      lastReviewedAt: nowIso(),
      incorrectCount: p.incorrectCount + 1,
      streak: 0,
      state: "learning",
    }));
    const lang = get().language;
    if (lang) {
      await recordActivity(lang, { wordsStudied: 1, incorrect: 1 });
    }
  },

  review: async (id, grade) => {
    const current = await getOrCreateProgress(id);
    const { progress } = schedule(current, grade, new Date());
    await saveProgress(progress);
    const nextMap = new Map(get().progressMap);
    nextMap.set(id, progress);
    set({ progressMap: nextMap });
    const lang = get().language;
    if (lang) {
      const correct = grade !== "forgot";
      await recordActivity(lang, {
        reviewsDone: 1,
        correct: correct ? 1 : 0,
        incorrect: correct ? 0 : 1,
      });
    }
  },

  toggleFavorite: (id) =>
    mutateProgress(get, set, id, (p) => ({ ...p, favorite: !p.favorite })),

  toggleWeak: (id) =>
    mutateProgress(get, set, id, (p) => ({ ...p, markedWeak: !p.markedWeak })),
}));
