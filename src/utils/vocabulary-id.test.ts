import { describe, it, expect } from "vitest";
import { inferLanguageFromId } from "./vocabulary-id";

describe("inferLanguageFromId", () => {
  it("nhận diện ID từ vựng thường", () => {
    expect(inferLanguageFromId("en-0001")).toBe("en");
    expect(inferLanguageFromId("zh-0050")).toBe("zh");
    expect(inferLanguageFromId("ko-0012")).toBe("ko");
    expect(inferLanguageFromId("ja-0033")).toBe("ja");
  });

  it("nhận diện ID phỏng vấn iv-<lang>-xxxx", () => {
    expect(inferLanguageFromId("iv-en-0001")).toBe("en");
    expect(inferLanguageFromId("iv-zh-0003")).toBe("zh");
    expect(inferLanguageFromId("iv-ja-0007")).toBe("ja");
  });

  it("trả null cho ID không nhận ra", () => {
    expect(inferLanguageFromId("xx-0001")).toBeNull();
    expect(inferLanguageFromId("random")).toBeNull();
  });
});
