import type { BackgroundEntry } from "./background-rotation";

/**
 * Chọn tài nguyên nền theo năng lực thiết bị (§20). Pure function — mọi tín hiệu
 * môi trường (mobile, save-data, reduced motion, chất lượng) được truyền vào để
 * test dễ dàng.
 */

export type BackgroundQuality = "saver" | "auto" | "high";

export interface DeviceCapability {
  isMobile: boolean;
  /** Chiều rộng viewport (px) để phân biệt desktop thường và desktop lớn. */
  viewportWidth: number;
  saveData: boolean;
  reducedMotion: boolean;
  quality: BackgroundQuality;
}

export interface SelectedAssets {
  /** Ảnh poster tối ưu nhất khả dụng cho thiết bị. */
  poster: string | null;
  /** Video nền hoặc null nếu không nên phát (mobile/save-data/reduced/không có). */
  video: string | null;
}

const firstDefined = (...vals: (string | undefined)[]): string | null =>
  vals.find((v) => typeof v === "string" && v.length > 0) ?? null;

/**
 * Quy tắc (§20):
 * - Mobile: poster mobile, không video 4K (không video).
 * - Desktop: poster 1080/1440; video 1080 tùy thiết bị.
 * - Desktop lớn (≥ 2560px): poster 4K; video 4K chỉ khi quality = high.
 * - Save Data / Reduced Motion: chỉ ảnh, không preload/không phát video.
 */
export function selectBackgroundAssets(
  entry: BackgroundEntry,
  cap: DeviceCapability,
): SelectedAssets {
  const d = entry.desktop;

  if (cap.isMobile) {
    return {
      poster: firstDefined(entry.mobile.posterWebp, d.posterWebp1080),
      video: null,
    };
  }

  const isLargeDesktop = cap.viewportWidth >= 2560;
  const poster = isLargeDesktop
    ? firstDefined(
        d.posterWebp4k,
        d.posterAvif4k,
        d.posterWebp1440,
        d.posterWebp1080,
      )
    : firstDefined(d.posterWebp1440, d.posterWebp1080, d.posterWebp4k);

  // Chỉ ảnh khi save-data, reduced motion, hoặc scene không có video.
  if (
    cap.saveData ||
    cap.reducedMotion ||
    !entry.hasVideo ||
    cap.quality === "saver"
  ) {
    return { poster, video: null };
  }

  const video =
    isLargeDesktop && cap.quality === "high"
      ? firstDefined(d.videoWebm4k, d.videoWebm1080)
      : firstDefined(d.videoWebm1080);

  return { poster, video };
}

/** Đọc năng lực thiết bị thực từ trình duyệt (không dùng trong test). */
export function detectDeviceCapability(
  quality: BackgroundQuality,
  reducedMotion: boolean,
  saveData: boolean,
): DeviceCapability {
  const width = typeof window !== "undefined" ? window.innerWidth : 1280;
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches &&
    width < 900;
  return {
    isMobile: Boolean(isMobile),
    viewportWidth: width,
    saveData,
    reducedMotion,
    quality,
  };
}
