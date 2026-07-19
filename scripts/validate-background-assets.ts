/**
 * Kiểm tra manifest và tài nguyên nền Corgi (§25).
 * Chạy: npm run validate:backgrounds
 *
 * - Với MỌI scene: bắt buộc id, titleVi, author, license; id không trùng.
 * - Với scene `enabled`: bắt buộc có poster mobile + poster desktop trên đĩa,
 *   sizeBytes > 0, license/author/sourceUrl hợp lệ; nếu `hasVideo` phải có video.
 * - File tồn tại phải nằm trong giới hạn dung lượng (§24).
 * Trả exit code khác 0 nếu có lỗi nghiêm trọng.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(ROOT, "public/backgrounds/manifest.json");
const publicDir = path.join(ROOT, "public");

const errors: string[] = [];
const warnings: string[] = [];

// Giới hạn dung lượng theo §24 (byte).
const LIMITS: Record<string, number> = {
  posterAvif4k: 2.5 * 1024 * 1024,
  posterWebp4k: 4 * 1024 * 1024,
  posterMobile: 1.5 * 1024 * 1024,
  videoWebm1080: 8 * 1024 * 1024,
  videoWebm4k: 25 * 1024 * 1024,
};

interface Entry {
  id: string;
  titleVi?: string;
  author?: string;
  license?: string;
  sourceUrl?: string;
  enabled?: boolean;
  hasVideo?: boolean;
  desktop?: Record<string, string>;
  mobile?: Record<string, string>;
  sizeBytes?: Record<string, number>;
}

if (!existsSync(manifestPath)) {
  console.error("❌ Không tìm thấy manifest.json nền.");
  process.exit(1);
}

const entries: Entry[] = JSON.parse(readFileSync(manifestPath, "utf8"));
const ids = new Set<string>();

const fileSize = (rel: string): number | null => {
  const full = path.join(publicDir, rel);
  return existsSync(full) ? statSync(full).size : null;
};

for (const e of entries) {
  const tag = e.id ?? "(thiếu id)";
  if (!e.id) errors.push("Scene thiếu id");
  else if (ids.has(e.id)) errors.push(`id trùng: ${e.id}`);
  else ids.add(e.id);

  if (!e.titleVi) errors.push(`[${tag}] thiếu titleVi`);
  if (!e.author) errors.push(`[${tag}] thiếu author`);
  if (!e.license) errors.push(`[${tag}] thiếu license`);

  // Kiểm tra dung lượng cho mọi file thực sự tồn tại.
  const checkSize = (rel: string | undefined, key: string) => {
    if (!rel) return;
    const size = fileSize(rel);
    if (size === null) return; // file chưa có — xử lý ở nhánh enabled bên dưới
    if (size === 0) warnings.push(`[${tag}] ${rel} rỗng (0 byte)`);
    const limit = LIMITS[key];
    if (limit && size > limit) {
      errors.push(
        `[${tag}] ${rel} vượt giới hạn (${(size / 1048576).toFixed(1)}MB > ${(limit / 1048576).toFixed(1)}MB)`,
      );
    }
  };
  checkSize(e.desktop?.posterAvif4k, "posterAvif4k");
  checkSize(e.desktop?.posterWebp4k, "posterWebp4k");
  checkSize(e.mobile?.posterWebp, "posterMobile");
  checkSize(e.desktop?.videoWebm1080, "videoWebm1080");
  checkSize(e.desktop?.videoWebm4k, "videoWebm4k");

  if (e.enabled) {
    // Scene bật: tài nguyên phải thực sự có mặt.
    const desktopPoster =
      e.desktop?.posterWebp1080 ||
      e.desktop?.posterWebp1440 ||
      e.desktop?.posterWebp4k;
    if (!desktopPoster || fileSize(desktopPoster) === null) {
      errors.push(`[${tag}] enabled nhưng thiếu poster desktop trên đĩa`);
    }
    if (!e.mobile?.posterWebp || fileSize(e.mobile.posterWebp) === null) {
      errors.push(`[${tag}] enabled nhưng thiếu poster mobile trên đĩa (§20)`);
    }
    if (e.license === "Project-owned" && e.author !== "LangPaw project") {
      warnings.push(`[${tag}] license Project-owned nhưng author khác dự án`);
    }
    if (e.license !== "Project-owned" && !e.sourceUrl) {
      errors.push(`[${tag}] tài nguyên bên ngoài phải có sourceUrl cụ thể`);
    }
    if (e.hasVideo) {
      const v = e.desktop?.videoWebm1080;
      if (!v || fileSize(v) === null) {
        errors.push(`[${tag}] hasVideo nhưng thiếu video 1080 trên đĩa`);
      }
    }
    if (e.sizeBytes && Object.values(e.sizeBytes).every((n) => n === 0)) {
      warnings.push(`[${tag}] enabled nhưng sizeBytes toàn 0 (chưa cập nhật)`);
    }
  }
}

const enabledCount = entries.filter((e) => e.enabled).length;
console.log(
  `Đã quét ${entries.length} scene nền (${enabledCount} bật, ${entries.length - enabledCount} chờ tài nguyên).`,
);

if (warnings.length) {
  console.warn(`\n⚠️  ${warnings.length} cảnh báo:`);
  for (const w of warnings) console.warn("  - " + w);
}
if (errors.length) {
  console.error(`\n❌ ${errors.length} lỗi nghiêm trọng:`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\n✅ Manifest nền hợp lệ.");
