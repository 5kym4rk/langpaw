import { describe, it, expect } from "vitest";
import {
  selectBackgroundAssets,
  type DeviceCapability,
} from "./background-capability";
import type { BackgroundEntry } from "./background-rotation";

const entry: BackgroundEntry = {
  id: "corgi-rainy-night",
  titleVi: "Corgi đêm mưa",
  desktop: {
    posterAvif4k: "p-4k.avif",
    posterWebp4k: "p-4k.webp",
    posterWebp1440: "p-1440.webp",
    posterWebp1080: "p-1080.webp",
    videoWebm1080: "v-1080.webm",
    videoWebm4k: "v-4k.webm",
  },
  mobile: { posterWebp: "p-mobile.webp" },
  author: "LangPaw project",
  sourceUrl: "",
  license: "Project-owned",
  enabled: true,
  hasVideo: true,
};

const cap = (over: Partial<DeviceCapability>): DeviceCapability => ({
  isMobile: false,
  viewportWidth: 1440,
  saveData: false,
  reducedMotion: false,
  quality: "auto",
  ...over,
});

describe("selectBackgroundAssets (§20)", () => {
  it("mobile: poster mobile, không video", () => {
    const r = selectBackgroundAssets(entry, cap({ isMobile: true }));
    expect(r.poster).toBe("p-mobile.webp");
    expect(r.video).toBeNull();
  });

  it("desktop thường: poster 1440, video 1080", () => {
    const r = selectBackgroundAssets(entry, cap({ viewportWidth: 1440 }));
    expect(r.poster).toBe("p-1440.webp");
    expect(r.video).toBe("v-1080.webm");
  });

  it("desktop lớn + high: poster 4K, video 4K", () => {
    const r = selectBackgroundAssets(
      entry,
      cap({ viewportWidth: 3840, quality: "high" }),
    );
    expect(r.poster).toBe("p-4k.webp");
    expect(r.video).toBe("v-4k.webm");
  });

  it("desktop lớn + auto: poster 4K nhưng video 1080 (không 4K)", () => {
    const r = selectBackgroundAssets(
      entry,
      cap({ viewportWidth: 3840, quality: "auto" }),
    );
    expect(r.poster).toBe("p-4k.webp");
    expect(r.video).toBe("v-1080.webm");
  });

  it("save data: chỉ ảnh", () => {
    const r = selectBackgroundAssets(entry, cap({ saveData: true }));
    expect(r.video).toBeNull();
    expect(r.poster).toBe("p-1440.webp");
  });

  it("reduced motion: chỉ ảnh", () => {
    const r = selectBackgroundAssets(entry, cap({ reducedMotion: true }));
    expect(r.video).toBeNull();
  });

  it("scene không có video: chỉ ảnh dù desktop", () => {
    const r = selectBackgroundAssets(
      { ...entry, hasVideo: false },
      cap({ quality: "high", viewportWidth: 3840 }),
    );
    expect(r.video).toBeNull();
    expect(r.poster).toBe("p-4k.webp");
  });
});
