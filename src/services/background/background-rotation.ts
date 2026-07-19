/** Tài nguyên desktop cho một scene (§19). */
export interface BackgroundDesktopAssets {
  posterAvif4k?: string;
  posterWebp4k?: string;
  posterWebp1440?: string;
  posterWebp1080?: string;
  videoWebm1080?: string;
  videoWebm4k?: string;
}

export interface BackgroundMobileAssets {
  posterWebp?: string;
}

export interface BackgroundEntry {
  id: string;
  titleVi: string;
  descriptionVi?: string;
  desktop: BackgroundDesktopAssets;
  mobile: BackgroundMobileAssets;
  author: string;
  sourceUrl: string;
  license: string;
  generatedWith?: string;
  generatedAt?: string;
  enabled: boolean;
  hasVideo: boolean;
  overlayOpacity?: number;
  overlayBlurPx?: number;
  sizeBytes?: Record<string, number>;
}

/**
 * Chọn nền kế tiếp, không lặp lại nền hiện tại khi có từ hai nền trở lên (§15.4).
 * Pure function, truyền `random` để test.
 */
export function pickNextBackground(
  currentId: string | null,
  backgrounds: BackgroundEntry[],
  random: () => number = Math.random,
): BackgroundEntry | null {
  const pool = backgrounds.filter((b) => b.enabled);
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  const candidates = pool.filter((b) => b.id !== currentId);
  const list = candidates.length > 0 ? candidates : pool;
  const index = Math.floor(random() * list.length);
  return list[index];
}

export interface RotatorOptions {
  backgrounds: BackgroundEntry[];
  intervalMs: number;
  onChange: (entry: BackgroundEntry) => void;
  random?: () => number;
  /** Nền khởi đầu (nếu khôi phục). */
  initialId?: string | null;
}

export interface BackgroundRotator {
  start: () => void;
  stop: () => void;
  /** Ép chuyển nền ngay (dùng cho nút, không tạo thêm timer). */
  advance: () => void;
  getCurrent: () => BackgroundEntry | null;
  isRunning: () => boolean;
}

/**
 * Bộ đổi nền theo chu kỳ. Chỉ duy trì DUY NHẤT một timer; hủy timer khi stop
 * (yêu cầu §15.4, §15.7). Không tự chạy cho tới khi gọi start().
 */
export function createBackgroundRotator(
  options: RotatorOptions,
): BackgroundRotator {
  const { backgrounds, intervalMs, onChange, random = Math.random } = options;
  let current: BackgroundEntry | null =
    backgrounds.find((b) => b.id === options.initialId && b.enabled) ?? null;
  let timer: ReturnType<typeof setInterval> | null = null;

  const clear = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const advance = () => {
    const next = pickNextBackground(current?.id ?? null, backgrounds, random);
    if (next) {
      current = next;
      onChange(next);
    }
  };

  return {
    start: () => {
      clear(); // Đảm bảo không tạo nhiều timer.
      // Hiển thị ngay một nền nếu chưa có.
      if (!current) advance();
      const pool = backgrounds.filter((b) => b.enabled);
      if (pool.length < 2) return; // Không cần timer nếu chỉ có 0-1 nền.
      timer = setInterval(advance, intervalMs);
    },
    stop: clear,
    advance,
    getCurrent: () => current,
    isRunning: () => timer !== null,
  };
}
