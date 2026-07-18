import type { LanguageCode } from "@/types";

export interface NormalizeOptions {
  /** Bỏ dấu thanh Pinyin khi so sánh tiếng Trung (giao diện vẫn hiển thị có dấu). */
  ignorePinyinTones?: boolean;
}

const PINYIN_TONE_MAP: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "ü",
  ǘ: "ü",
  ǚ: "ü",
  ǜ: "ü",
};

function stripPinyinTones(input: string): string {
  return input.replace(
    /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g,
    (c) => PINYIN_TONE_MAP[c] ?? c,
  );
}

/**
 * Chuẩn hóa câu trả lời theo ngôn ngữ. Pure function (§14.2).
 * - Trim + gom khoảng trắng thành một.
 * - Unicode NFC.
 * - Tiếng Anh: không phân biệt hoa thường.
 * - Tiếng Trung: tùy chọn bỏ dấu thanh Pinyin để so sánh.
 */
export function normalizeAnswer(
  input: string,
  language: LanguageCode,
  options: NormalizeOptions = {},
): string {
  let value = input.normalize("NFC").trim().replace(/\s+/g, " ");

  if (language === "en") {
    value = value.toLowerCase();
  }

  if (language === "zh" && options.ignorePinyinTones) {
    value = stripPinyinTones(value.toLowerCase());
  }

  return value;
}

/**
 * So sánh câu trả lời người dùng với đáp án đúng (kể cả alternate forms).
 */
export function isAnswerCorrect(
  userInput: string,
  accepted: string[],
  language: LanguageCode,
  options: NormalizeOptions = {},
): boolean {
  const normalizedInput = normalizeAnswer(userInput, language, options);
  if (!normalizedInput) return false;
  return accepted.some(
    (answer) => normalizeAnswer(answer, language, options) === normalizedInput,
  );
}
