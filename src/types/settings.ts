import type { LanguageCode } from "./vocabulary";
import type { DailyGoal } from "@/config/learning";

export interface UserSettings {
  interfaceLanguage: "vi";
  targetLanguage: LanguageCode;
  dailyGoal: DailyGoal;

  showMeaning: boolean;
  showReading: boolean;
  showRomanization: boolean;
  showExample: boolean;
  showExampleTranslation: boolean;

  speechEnabled: boolean;
  speechVoiceURI?: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  repeatCount: number;
  pauseMs: number;

  dynamicBackgroundEnabled: boolean;
  staticBackgroundMode: boolean;
  backgroundDarkness: number;
  backgroundBlurPx: number;
  reducedMotion: boolean;
  dataSaver: boolean;

  musicEnabled: boolean;
  musicTrack?: string;
  musicVolume: number;
}
