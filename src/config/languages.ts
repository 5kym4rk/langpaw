import type { LanguageCode } from "@/types/vocabulary";

export interface LanguageConfig {
  code: LanguageCode;
  labelVi: string;
  nativeName: string;
  flag: string;
  /** Locale mặc định cho Speech Synthesis. */
  speechLocale: string;
  /** Các locale thay thế được chấp nhận. */
  altLocales: string[];
  readingLabel: string;
  hasRomanization: boolean;
}

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    code: "en",
    labelVi: "Tiếng Anh",
    nativeName: "English",
    flag: "🇬🇧",
    speechLocale: "en-US",
    altLocales: ["en-GB", "en"],
    readingLabel: "IPA",
    hasRomanization: false,
  },
  zh: {
    code: "zh",
    labelVi: "Tiếng Trung",
    nativeName: "中文",
    flag: "🇨🇳",
    speechLocale: "zh-CN",
    altLocales: ["zh", "zh-Hans"],
    readingLabel: "Pinyin",
    hasRomanization: true,
  },
  ko: {
    code: "ko",
    labelVi: "Tiếng Hàn",
    nativeName: "한국어",
    flag: "🇰🇷",
    speechLocale: "ko-KR",
    altLocales: ["ko"],
    readingLabel: "Hangul",
    hasRomanization: true,
  },
  ja: {
    code: "ja",
    labelVi: "Tiếng Nhật",
    nativeName: "日本語",
    flag: "🇯🇵",
    speechLocale: "ja-JP",
    altLocales: ["ja"],
    readingLabel: "Kana",
    hasRomanization: true,
  },
};

export const LANGUAGE_ORDER: LanguageCode[] = ["en", "zh", "ko", "ja"];

export const VIETNAMESE_SPEECH_LOCALE = "vi-VN";
