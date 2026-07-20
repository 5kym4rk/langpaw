/**
 * Importer Từ điển Anh–Việt (StarDict).
 *   npm run import:en-vi -- /đường/dẫn/thư-mục-stardict_en_vi
 * (thư mục chứa en_vi.idx và en_vi.dict — giải nén .dict.dz trước nếu cần)
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  cleanViMeaning,
  buildDictionaryDataset,
  type DictCandidate,
} from "../src/services/data/import/parsers.ts";
import { readStarDict } from "./stardict.ts";
import { writeDataset } from "./import-common.ts";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error("\n❌ Cần thư mục StarDict Anh–Việt (có .idx và .dict).\n");
  process.exit(1);
}
const files = readdirSync(dir);
const idx = files.find((f) => f.endsWith(".idx"));
const dict = files.find((f) => f.endsWith(".dict"));
if (!idx || !dict) {
  console.error("\n❌ Thiếu file .idx hoặc .dict (giải nén .dict.dz trước).\n");
  process.exit(1);
}

const entries = readStarDict(path.join(dir, idx), path.join(dir, dict));
const cands: DictCandidate[] = [];
for (const e of entries) {
  const term = e.word.trim();
  // Chỉ lấy từ đơn, chữ cái thường (bỏ cụm từ, tên riêng, ký tự lạ).
  if (!/^[a-z][a-z-]{1,}$/.test(term)) continue;
  const meaningVi = cleanViMeaning(e.definition);
  if (!meaningVi) continue;
  cands.push({ term, meaningVi });
}

const dataset = buildDictionaryDataset(cands, {
  language: "en",
  sourceId: "envi-stardict",
  idPrefix: "en-vi-",
  baseLevel: "Từ điển Anh–Việt",
  advancedLevel: "Nâng cao (Anh–Việt)",
  baseCount: 8000,
  cap: 20000,
  topic: "Từ điển",
});

writeDataset(
  { dataset, matched: [], missing: [] },
  {
    sourceId: "envi-stardict",
    outFile: "src/data/en/generated/en-vi.json",
    language: "en",
  },
);
