/**
 * Kiểm tra toàn bộ dataset từ vựng JSON trong src/data.
 * Chạy: npm run validate:data
 *
 * Trả exit code khác 0 nếu có lỗi nghiêm trọng (schema, trùng ID, thiếu nguồn…).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  vocabularyDatasetSchema,
  type VocabularyDatasetInput,
} from "../src/data/schema.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../src/data");

const errors: string[] = [];
const warnings: string[] = [];

const hasHan = (s: string) => /[一-鿿]/.test(s);
const hasKanji = (s: string) => /[一-鿿]/.test(s);
const hasKana = (s: string) => /[぀-ヿ]/.test(s);

// Đệ quy tìm file .json — không phụ thuộc globSync (chỉ có từ Node 22+).
function findJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      result.push(full);
    }
  }
  return result;
}

const files = findJsonFiles(dataDir).filter(
  (f) => !f.endsWith("manifest.json"),
);

let emptyExampleCount = 0;
const allItemIds = new Set<string>();
const allSourceIds = new Set<string>();
const termKeys = new Map<string, string>(); // lang|level|topic|term -> itemId
const datasets: VocabularyDatasetInput[] = [];

for (const file of files) {
  const rel = path.relative(dataDir, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`[${rel}] JSON không hợp lệ: ${(e as Error).message}`);
    continue;
  }

  const parsed = vocabularyDatasetSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`[${rel}] ${issue.path.join(".")}: ${issue.message}`);
    }
    continue;
  }

  const dataset = parsed.data;
  datasets.push(dataset);

  for (const source of dataset.sources) {
    if (allSourceIds.has(source.id)) {
      warnings.push(`[${rel}] source.id trùng: ${source.id}`);
    }
    allSourceIds.add(source.id);
    // §11: nguồn nên khai báo giấy phép.
    if (!source.license) {
      warnings.push(`[${rel}] nguồn "${source.id}" thiếu license`);
    }
  }

  // §11: dataset nên có phiên bản syllabus/dataset để không trộn tiêu chuẩn.
  if (!dataset.syllabusVersion) {
    warnings.push(`[${rel}] dataset thiếu syllabusVersion (phiên bản dataset)`);
  }
}

// Gom source id toàn cục để kiểm tra tham chiếu.
const globalSourceIds = new Set<string>();
for (const dataset of datasets) {
  for (const s of dataset.sources) globalSourceIds.add(s.id);
}

for (const dataset of datasets) {
  for (const item of dataset.items) {
    // Trùng ID toàn dự án
    if (allItemIds.has(item.id)) {
      errors.push(`ID trùng trong toàn dự án: ${item.id}`);
    }
    allItemIds.add(item.id);

    // source ID không tồn tại
    for (const sid of item.sourceIds) {
      if (!globalSourceIds.has(sid)) {
        errors.push(`[${item.id}] sourceId không tồn tại: ${sid}`);
      }
    }

    // Trùng term trong cùng ngôn ngữ/cấp độ/chủ đề
    const key = `${item.language}|${item.level}|${item.topic}|${item.term}`;
    if (termKeys.has(key)) {
      warnings.push(
        `Trùng term "${item.term}" (${key}) giữa ${termKeys.get(key)} và ${item.id}`,
      );
    } else {
      termKeys.set(key, item.id);
    }

    // Tiếng Trung: có Pinyin (reading) khi term chứa chữ Hán
    if (item.language === "zh" && hasHan(item.term) && !item.reading) {
      errors.push(`[${item.id}] Tiếng Trung thiếu reading (Pinyin)`);
    }

    // Tiếng Nhật: có Kana khi term chứa Kanji
    if (
      item.language === "ja" &&
      hasKanji(item.term) &&
      !hasKana(item.reading ?? "")
    ) {
      errors.push(`[${item.id}] Tiếng Nhật thiếu Kana trong reading`);
    }

    // §11: ví dụ trống là cờ chất lượng (không chặn) — đếm gộp để tránh ồn.
    if (!item.example || !item.exampleVi) emptyExampleCount += 1;

    // §4.1/§11: verified bắt buộc có nguồn entry cụ thể.
    if (
      item.reviewStatus === "verified" &&
      !item.sourceEntryUrl &&
      !item.sourceEntryId
    ) {
      errors.push(
        `[${item.id}] reviewStatus=verified nhưng thiếu sourceEntryUrl/sourceEntryId`,
      );
    }
  }
}

console.log(`Đã quét ${files.length} file, ${allItemIds.size} mục từ vựng.`);
if (emptyExampleCount > 0) {
  console.log(
    `ℹ️  ${emptyExampleCount} mục chưa có câu ví dụ (draft, chờ bổ sung).`,
  );
}

if (warnings.length) {
  console.warn(`\n⚠️  ${warnings.length} cảnh báo:`);
  for (const w of warnings) console.warn("  - " + w);
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} lỗi nghiêm trọng:`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log("\n✅ Dữ liệu hợp lệ.");
