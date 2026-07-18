import { describe, it, expect } from "vitest";
import { normalizeAnswer, isAnswerCorrect } from "./normalize-answer";

describe("normalizeAnswer", () => {
  it("trim và gom khoảng trắng", () => {
    expect(normalizeAnswer("  hello   world ", "en")).toBe("hello world");
  });

  it("tiếng Anh không phân biệt hoa thường", () => {
    expect(normalizeAnswer("Hello", "en")).toBe("hello");
  });

  it("chuẩn hóa NFC", () => {
    const decomposed = "é"; // e + dấu sắc tổ hợp
    expect(normalizeAnswer(decomposed, "en")).toBe("é".normalize("NFC"));
  });

  it("tiếng Trung bỏ dấu thanh khi bật tùy chọn", () => {
    expect(normalizeAnswer("diànzǐ", "zh", { ignorePinyinTones: true })).toBe(
      "dianzi",
    );
  });

  it("tiếng Trung giữ dấu thanh khi không bật tùy chọn", () => {
    expect(normalizeAnswer("diànzǐ", "zh")).toBe("diànzǐ");
  });
});

describe("isAnswerCorrect", () => {
  it("chấp nhận đáp án đúng bất kể khoảng trắng/hoa thường (en)", () => {
    expect(isAnswerCorrect("  HELLO ", ["hello"], "en")).toBe(true);
  });

  it("từ chối đáp án rỗng", () => {
    expect(isAnswerCorrect("   ", ["hello"], "en")).toBe(false);
  });

  it("chấp nhận alternate forms", () => {
    expect(isAnswerCorrect("colour", ["color", "colour"], "en")).toBe(true);
  });

  it("Pinyin bỏ dấu thanh khớp khi bật tùy chọn", () => {
    expect(
      isAnswerCorrect("dianzi", ["diànzǐ"], "zh", { ignorePinyinTones: true }),
    ).toBe(true);
  });
});
