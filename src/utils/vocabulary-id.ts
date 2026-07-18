import type { LanguageCode } from "@/types";

const LANGS: LanguageCode[] = ["en", "zh", "ko", "ja"];

/**
 * Suy ra mã ngôn ngữ từ ID từ vựng theo quy ước đặt tên.
 * Ví dụ: "en-0001" → "en"; "iv-zh-0003" → "zh".
 * Trả về null nếu không nhận ra.
 */
export function inferLanguageFromId(id: string): LanguageCode | null {
  const parts = id.split("-");
  // Dạng phỏng vấn: iv-<lang>-xxxx
  if (parts[0] === "iv" && parts[1]) {
    return LANGS.includes(parts[1] as LanguageCode)
      ? (parts[1] as LanguageCode)
      : null;
  }
  // Dạng thông thường: <lang>-xxxx
  return LANGS.includes(parts[0] as LanguageCode)
    ? (parts[0] as LanguageCode)
    : null;
}
