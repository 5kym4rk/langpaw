import { describe, it, expect } from "vitest";
import { buildSpeakOptions } from "./speak-options";

const base = {
  speechVoiceByLanguage: {},
  speechVoiceURI: undefined,
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
};

describe("buildSpeakOptions", () => {
  it("dùng locale đúng theo ngôn ngữ", () => {
    expect(buildSpeakOptions(base, "en").lang).toBe("en-US");
    expect(buildSpeakOptions(base, "zh").lang).toBe("zh-CN");
    expect(buildSpeakOptions(base, "ja").lang).toBe("ja-JP");
  });

  it("ưu tiên giọng riêng của ngôn ngữ", () => {
    const s = {
      ...base,
      speechVoiceByLanguage: { ja: "ja-voice" },
      speechVoiceURI: "default-voice",
    };
    expect(buildSpeakOptions(s, "ja").voiceURI).toBe("ja-voice");
    expect(buildSpeakOptions(s, "en").voiceURI).toBe("default-voice");
  });

  it("áp dụng hệ số tốc độ", () => {
    const s = { ...base, speechRate: 1 };
    expect(buildSpeakOptions(s, "en", 0.6).rate).toBeCloseTo(0.6);
  });
});
