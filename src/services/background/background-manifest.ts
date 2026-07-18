import { assetUrl } from "@/config/app";
import type { BackgroundEntry } from "./background-rotation";

/**
 * Tải manifest nền từ public/backgrounds/manifest.json qua BASE_URL (an toàn cho
 * GitHub Pages subpath). Trả mảng rỗng nếu lỗi — không crash.
 */
export async function loadBackgroundManifest(): Promise<BackgroundEntry[]> {
  try {
    const res = await fetch(assetUrl("backgrounds/manifest.json"));
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is BackgroundEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as BackgroundEntry).id === "string",
    );
  } catch {
    return [];
  }
}
