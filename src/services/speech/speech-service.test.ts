import { describe, it, expect } from "vitest";
import { speechService } from "./speech-service";
import { createInitialProgress } from "@/services/srs/progress-factory";

describe("speechService (không có Web Speech API trong jsdom)", () => {
  it("không crash khi speechSynthesis không tồn tại", () => {
    expect(speechService.isSupported()).toBe(false);
    expect(speechService.getVoices()).toEqual([]);
    expect(() => speechService.cancel()).not.toThrow();
    expect(() => speechService.pause()).not.toThrow();
    expect(() => speechService.resume()).not.toThrow();
  });

  it("speak trả về Promise resolve khi không hỗ trợ", async () => {
    await expect(
      speechService.speak("hello", { lang: "en-US" }),
    ).resolves.toBeUndefined();
  });

  it("ready trả về mảng rỗng khi không hỗ trợ", async () => {
    await expect(speechService.ready()).resolves.toEqual([]);
  });
});

describe("createInitialProgress", () => {
  it("tạo tiến độ mặc định hợp lệ cho từ mới", () => {
    const p = createInitialProgress("en-0001");
    expect(p.vocabularyId).toBe("en-0001");
    expect(p.state).toBe("new");
    expect(p.easeFactor).toBe(2.5);
    expect(p.favorite).toBe(false);
  });
});
