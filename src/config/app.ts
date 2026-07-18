export const APP_CONFIG = {
  name: "LangPaw",
  shortName: "LangPaw",
  description: "Ứng dụng học ngoại ngữ dành cho người Việt",
  version: "0.1.0",
  backgroundRotationMs: 600_000, // 10 phút
} as const;

/**
 * Nối đường dẫn asset dựa trên base URL của Vite (an toàn cho GitHub Pages subpath).
 * Không tự nối chuỗi "/" thủ công ở nơi khác.
 */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL; // luôn kết thúc bằng "/"
  const clean = relativePath.replace(/^\//, "");
  return `${base}${clean}`;
}
