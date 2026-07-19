import type { LanguageCode } from "./vocabulary";
import type { DailyGoal } from "@/config/learning";
import type { ReviewLevel } from "@/services/data/vocabulary-filters";

export interface UserSettings {
  interfaceLanguage: "vi";
  targetLanguage: LanguageCode;
  dailyGoal: DailyGoal;
  /** Lọc nội dung theo mức kiểm duyệt tối thiểu trong các chế độ học. */
  contentReviewLevel: ReviewLevel;

  showMeaning: boolean;
  showReading: boolean;
  showRomanization: boolean;
  showExample: boolean;
  showExampleTranslation: boolean;

  speechEnabled: boolean;
  /** Giọng đọc mặc định (dùng khi ngôn ngữ chưa chọn giọng riêng). */
  speechVoiceURI?: string;
  /** Giọng đọc riêng cho từng ngôn ngữ (voiceURI). */
  speechVoiceByLanguage: Partial<Record<LanguageCode, string>>;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  repeatCount: number;
  pauseMs: number;

  dynamicBackgroundEnabled: boolean;
  /** Chu kỳ đổi nền (phút): 5 / 10 / 20 / 30. */
  backgroundCycleMinutes: number;
  staticBackgroundMode: boolean;
  backgroundDarkness: number;
  backgroundBlurPx: number;
  reducedMotion: boolean;
  dataSaver: boolean;

  musicEnabled: boolean;
  musicTrack?: string;
  musicVolume: number;
}
