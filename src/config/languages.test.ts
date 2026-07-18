import { describe, it, expect } from "vitest";
import { LANGUAGES, LANGUAGE_ORDER } from "./languages";

describe("cấu hình ngôn ngữ", () => {
  it("có đủ bốn ngôn ngữ theo đúng thứ tự", () => {
    expect(LANGUAGE_ORDER).toEqual(["en", "zh", "ko", "ja"]);
  });

  it("mỗi ngôn ngữ có locale phát âm hợp lệ", () => {
    for (const code of LANGUAGE_ORDER) {
      const config = LANGUAGES[code];
      expect(config.code).toBe(code);
      expect(config.speechLocale).toMatch(/^[a-z]{2}(-[A-Za-z]+)?$/);
      expect(config.labelVi.length).toBeGreaterThan(0);
    }
  });
});
