/**
 * Importer Từ điển Nhật–Việt (StarDict).
 *   npm run import:ja-vi -- /đường/dẫn/thư-mục-NhatViet
 * Cách đọc (kana) lấy từ headword nếu là kana; nếu term có kanji mà thiếu kana,
 * để trống (được validate gắn cờ cảnh báo).
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  cleanViMeaning,
  extractKanaReading,
  buildDictionaryDataset,
  type DictCandidate,
} from "../src/services/data/import/parsers.ts";
import { readStarDict } from "./stardict.ts";
import { writeDataset } from "./import-common.ts";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error("\n❌ Cần thư mục StarDict Nhật–Việt (có .idx và .dict).\n");
  process.exit(1);
}
const files = readdirSync(dir);
const idx = files.find((f) => f.endsWith(".idx"));
const dict = files.find((f) => f.endsWith(".dict"));
if (!idx || !dict) {
  console.error("\n❌ Thiếu file .idx hoặc .dict.\n");
  process.exit(1);
}

const isKana = (s: string) => /^[぀-ヿー]+$/.test(s);
const hasJapanese = (s: string) => /[぀-ヿ一-龯]/.test(s);
// Ký hiệu lặp / kéo dài — không phải từ.
const isMarkOnly = (s: string) => /^[ゝゞヽヾー々〃ヶヵ]+$/.test(s);

const entries = readStarDict(path.join(dir, idx), path.join(dir, dict));
const cands: DictCandidate[] = [];
for (const e of entries) {
  const term = e.word.trim();
  // Bỏ ký hiệu và kana đơn lẻ (thường là trợ từ/mảnh, ít hữu ích).
  if (!term || term.includes(" ") || !hasJapanese(term) || isMarkOnly(term))
    continue;
  if (term.length === 1 && isKana(term)) continue;
  const meaningVi = cleanViMeaning(e.definition);
  if (!meaningVi) continue;
  const reading = isKana(term) ? term : extractKanaReading(e.definition);
  cands.push({ term, meaningVi, reading });
}

const dataset = buildDictionaryDataset(cands, {
  language: "ja",
  sourceId: "javi-stardict",
  idPrefix: "ja-vi-",
  baseLevel: "Từ điển Nhật–Việt",
  advancedLevel: "Nâng cao (Nhật–Việt)",
  baseCount: 8000,
  cap: 20000,
  topic: "Từ điển",
});

writeDataset(
  { dataset, matched: [], missing: [] },
  {
    sourceId: "javi-stardict",
    outFile: "src/data/ja/generated/ja-vi.json",
    language: "ja",
  },
);
