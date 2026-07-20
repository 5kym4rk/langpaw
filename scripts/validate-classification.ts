/**
 * Validation phân loại (spec XI). Chạy:
 *   npm run validate:classification   — toàn bộ
 *   npm run validate:learning-ready   — chỉ nhóm learningReady
 *   npm run validate:topics           — chỉ nhóm chủ đề
 * Hard error → exit 1. Warning không chặn.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VocabularyItem } from "../src/types/vocabulary.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(ROOT, "src/data");
const mode = process.argv[2] ?? "";

function findJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "certification") continue;
      out.push(...findJsonFiles(full));
    } else if (e.name.endsWith(".json") && !e.name.includes("manifest"))
      out.push(full);
  }
  return out;
}

const errors: string[] = [];
const warnings: string[] = [];
const items: VocabularyItem[] = [];
for (const f of findJsonFiles(dataDir)) {
  const doc = JSON.parse(readFileSync(f, "utf8"));
  if (Array.isArray(doc.items)) items.push(...doc.items);
  // Nguồn: URL rỗng / giấy phép không rõ → warning (spec IX).
  for (const s of doc.sources ?? []) {
    if (!s.url) warnings.push(`[nguồn ${s.id}] URL rỗng`);
    if (!s.license || /xem giấy phép/i.test(s.license))
      warnings.push(`[nguồn ${s.id}] giấy phép chưa xác minh`);
  }
}

const seenIds = new Set<string>();
const dupKey = new Map<string, string>();
const checkAll = mode === "";
const checkReady = checkAll || mode === "--learning-ready";
const checkTopics = checkAll || mode === "--topics";

for (const it of items) {
  if (checkAll) {
    if (seenIds.has(it.id)) errors.push(`ID trùng: ${it.id}`);
    seenIds.add(it.id);
    const k = `${it.language}|${it.term}|${it.reading ?? ""}|${it.meaningVi}`;
    if (dupKey.has(k))
      warnings.push(
        `Trùng hoàn toàn term/reading/meaning: ${it.id} ~ ${dupKey.get(k)}`,
      );
    else dupKey.set(k, it.id);
  }

  if (checkReady && it.learningReady === true) {
    if (it.certificateRequiresReview)
      errors.push(`[${it.id}] learningReady nhưng certificateRequiresReview`);
    if (it.senseMismatch)
      errors.push(`[${it.id}] learningReady nhưng senseMismatch`);
    if (it.invalidMeaning)
      errors.push(`[${it.id}] learningReady nhưng invalidMeaning`);
    if (!it.certificateLevel)
      errors.push(`[${it.id}] learningReady nhưng thiếu certificateLevel`);
    if (!it.meaningVi?.trim())
      errors.push(`[${it.id}] learningReady nhưng meaningVi rỗng`);
    if (
      (it.language === "zh" || it.language === "ko") &&
      !(it.reading || it.romanization)
    )
      errors.push(
        `[${it.id}] learningReady nhưng thiếu cách đọc (${it.language})`,
      );
    if (it.language === "ja" && /[一-鿿]/.test(it.term) && !it.reading)
      errors.push(`[${it.id}] learningReady nhưng kanji thiếu reading`);
  }

  if (checkTopics) {
    if (it.topic === "Từ điển")
      errors.push(`[${it.id}] topic="Từ điển" bị cấm`);
    if (
      it.topicIds &&
      it.topicIds.length === 0 &&
      it.topicStatus !== "unclassified"
    )
      errors.push(
        `[${it.id}] topicIds rỗng nhưng topicStatus=${it.topicStatus}`,
      );
  }
}

// Summary tồn tại?
if (checkAll && !existsSync(path.join(dataDir, "certification/summary.json"))) {
  errors.push("Thiếu src/data/certification/summary.json (chạy build:certs)");
}

console.log(`Đã kiểm ${items.length} mục (${mode || "all"}).`);
if (warnings.length) {
  console.warn(`⚠️  ${warnings.length} cảnh báo:`);
  for (const w of warnings.slice(0, 15)) console.warn("  - " + w);
  if (warnings.length > 15) console.warn(`  … và ${warnings.length - 15} nữa`);
}
if (errors.length) {
  console.error(`❌ ${errors.length} lỗi nghiêm trọng:`);
  for (const e of errors.slice(0, 20)) console.error("  - " + e);
  process.exit(1);
}
console.log("✅ Phân loại hợp lệ.");
