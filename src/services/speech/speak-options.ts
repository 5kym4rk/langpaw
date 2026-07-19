import type { LanguageCode, UserSettings } from "@/types";
import { LANGUAGES } from "@/config/languages";
import type { SpeakOptions } from "./speech-service";

/**
 * Dựng SpeakOptions từ thiết lập người dùng cho một ngôn ngữ mục tiêu.
 * Ưu tiên giọng riêng của ngôn ngữ, rồi tới giọng mặc định. Pure function.
 */
export function buildSpeakOptions(
  settings: Pick<
    UserSettings,
    | "speechVoiceByLanguage"
    | "speechVoiceURI"
    | "speechRate"
    | "speechPitch"
    | "speechVolume"
  >,
  language: LanguageCode,
  rateFactor = 1,
): SpeakOptions {
  const voiceURI =
    settings.speechVoiceByLanguage[language] ?? settings.speechVoiceURI;
  return {
    lang: LANGUAGES[language].speechLocale,
    voiceURI,
    rate: settings.speechRate * rateFactor,
    pitch: settings.speechPitch,
    volume: settings.speechVolume,
  };
}
