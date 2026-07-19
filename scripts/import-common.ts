/**
 * Tiện ích chung cho các script importer (§5–8). Đọc seed, ghi dataset draft đã
 * kiểm tra schema, và dồn các mục chưa tra được vào hàng đợi rà soát.
 *
 * Nguyên tắc: script chỉ chạy trên máy có sẵn file nguồn đã tải hợp lệ; KHÔNG
 * tự tải hàng loạt, KHÔNG commit API key, KHÔNG nâng trạng thái verified.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vocabularyDatasetSchema } from "../src/data/schema.ts";
import type { VocabularySource } from "../src/types/vocabulary.ts";
import type {
  BuildResult,
  VocabularySeed,
} from "../src/services/data/import/parsers.ts";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Đăng ký nguồn — id khớp với sourceIds trong dataset (§4.2, §26). */
export const SOURCES: Record<string, VocabularySource> = {
  "oewn-2025": {
    id: "oewn-2025",
    authority: "Open English WordNet",
    title: "Open English WordNet 2025",
    url: "https://en-word.net/",
    license: "CC BY 4.0",
    retrievedAt: new Date().toISOString().slice(0, 10),
    sourceVersion: "2025",
    usageNote:
      "Chỉ lấy lemma/pos/definition/id cho tập từ chọn lọc; nghĩa Việt do dự án biên soạn (draft).",
  },
  "cc-cedict": {
    id: "cc-cedict",
    authority: "MDBG / CC-CEDICT",
    title: "CC-CEDICT Chinese-English dictionary",
    url: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
    license: "CC BY-SA 4.0",
    retrievedAt: new Date().toISOString().slice(0, 10),
    usageNote:
      "Giản thể/phồn thể/pinyin/nghĩa Anh cho tập từ chọn lọc; nghĩa Việt do dự án biên soạn (draft).",
  },
  jmdict: {
    id: "jmdict",
    authority: "EDRDG",
    title: "JMdict Japanese-Multilingual dictionary",
    url: "https://www.edrdg.org/jmdict/j_jmdict.html",
    license: "CC BY-SA 4.0",
    retrievedAt: new Date().toISOString().slice(0, 10),
    usageNote:
      "Kanji/kana/pos/gloss/ent_seq cho tập từ chọn lọc; nghĩa Việt do dự án biên soạn (draft). Không nhập proper names.",
  },
  krdict: {
    id: "krdict",
    authority: "National Institute of Korean Language",
    title: "Korean Basic Dictionary (krdict) Open API",
    url: "https://krdict.korean.go.kr/",
    license: "Xem điều khoản krdict Open API",
    retrievedAt: new Date().toISOString().slice(0, 10),
    usageNote:
      "Cách đọc/nghĩa gốc/entry id cho tập từ chọn lọc; không tải multimedia; nghĩa Việt do dự án biên soạn (draft).",
  },
};

export function readSeeds(language: string): VocabularySeed[] {
  const p = path.join(ROOT, "scripts", "import-seeds", `${language}.json`);
  if (!existsSync(p)) {
    throw new Error(`Không tìm thấy seed: ${p}`);
  }
  return JSON.parse(readFileSync(p, "utf8")) as VocabularySeed[];
}

/** Đọc file nguồn bắt buộc, báo lỗi rõ nếu thiếu (kèm hướng dẫn tải). */
export function requireSourceFile(argvIndex: number, hint: string): string {
  const file = process.argv[argvIndex];
  if (!file || !existsSync(file)) {
    console.error(
      `\n❌ Thiếu file nguồn.\n   Cách dùng: đưa đường dẫn file đã tải.\n   ${hint}\n`,
    );
    process.exit(1);
  }
  return readFileSync(file, "utf8");
}

/** Ghi dataset draft (đã validate schema) và append seed thiếu vào review queue. */
export function writeDataset(
  result: BuildResult,
  opts: { sourceId: string; outFile: string; language: string },
): void {
  const dataset = {
    ...result.dataset,
    sources: [SOURCES[opts.sourceId]],
  };

  const parsed = vocabularyDatasetSchema.safeParse(dataset);
  if (!parsed.success) {
    console.error("❌ Dataset không hợp lệ theo schema:");
    console.error(parsed.error.issues.slice(0, 10));
    process.exit(1);
  }

  const outPath = path.join(ROOT, opts.outFile);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");

  console.log(
    `✅ Ghi ${dataset.items.length} mục draft → ${opts.outFile}` +
      ` (khớp ${result.matched.length}, thiếu ${result.missing.length})`,
  );

  if (result.missing.length > 0) {
    appendReviewQueue(opts.language, opts.sourceId, result.missing);
    console.log(
      `📝 Đã ghi ${result.missing.length} mục chưa tra được vào docs/DATA_REVIEW_QUEUE.md`,
    );
  }
}

function appendReviewQueue(
  language: string,
  sourceId: string,
  missing: string[],
): void {
  const p = path.join(ROOT, "docs", "DATA_REVIEW_QUEUE.md");
  const stamp = new Date().toISOString().slice(0, 10);
  const rows = missing
    .map(
      (term) =>
        `| ${language} | ${term} | | | | ${sourceId} | Không tra được trong nguồn | cao | | draft |`,
    )
    .join("\n");
  const block = `\n<!-- import ${stamp} (${sourceId}) -->\n${rows}\n`;
  if (existsSync(p)) {
    writeFileSync(p, readFileSync(p, "utf8") + block, "utf8");
  }
}
