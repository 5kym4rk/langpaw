import { create } from "zustand";
import type { UserSettings } from "@/types";
import type { LanguageCode } from "@/types/vocabulary";
import { DEFAULT_SPEECH } from "@/config/learning";

const SETTINGS_STORAGE_KEY = "langpaw.settings.v1";

export const DEFAULT_SETTINGS: UserSettings = {
  interfaceLanguage: "vi",
  targetLanguage: "en",
  dailyGoal: 10,
  contentReviewLevel: "all",

  showMeaning: true,
  showReading: true,
  showRomanization: true,
  showExample: true,
  showExampleTranslation: true,

  speechEnabled: true,
  speechVoiceByLanguage: {},
  speechRate: DEFAULT_SPEECH.rate,
  speechPitch: DEFAULT_SPEECH.pitch,
  speechVolume: DEFAULT_SPEECH.volume,
  repeatCount: DEFAULT_SPEECH.repeatCount,
  pauseMs: DEFAULT_SPEECH.pauseMs,

  dynamicBackgroundEnabled: true,
  staticBackgroundMode: false,
  backgroundDarkness: 0.45,
  backgroundBlurPx: 2,
  reducedMotion: false,
  dataSaver: false,

  musicEnabled: false,
  musicVolume: 0.4,
};

function loadInitial(): UserSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(settings: UserSettings): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Bỏ qua lỗi quota / private mode — không được crash ứng dụng.
  }
}

interface SettingsState {
  settings: UserSettings;
  setTargetLanguage: (language: LanguageCode) => void;
  update: (patch: Partial<UserSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: loadInitial(),
  setTargetLanguage: (language) =>
    set((state) => {
      const next = { ...state.settings, targetLanguage: language };
      persist(next);
      return { settings: next };
    }),
  update: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch };
      persist(next);
      return { settings: next };
    }),
  reset: () => {
    persist(DEFAULT_SETTINGS);
    return set({ settings: DEFAULT_SETTINGS });
  },
}));
