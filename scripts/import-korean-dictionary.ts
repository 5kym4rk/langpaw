/**
 * Importer Korean Basic Dictionary — krdict (§7.1).
 * Dùng bản tải JSON đầy đủ (LMF) từ krdict (Open API bị chặn theo IP). Giải nén
 * các file *_5000_*.json vào một thư mục rồi chạy:
 *   npm run import:ko -- /đường/dẫn/thư-mục-json
 *
 * Nếu không truyền thư mục, thử KRDICT_JSON_DIR trong .env.import.local.
 * Nghĩa Việt do dự án biên soạn (draft); krdict cấp cách đọc/POS/nghĩa Anh/id.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  parseKrdictLmf,
  buildDatasetFromSeeds,
} from "../src/services/data/import/parsers.ts";
import { readSeeds, writeDataset, ROOT } from "./import-common.ts";

function resolveDir(): string {
  const arg = process.argv[2];
  if (arg && existsSync(arg) && statSync(arg).isDirectory()) return arg;
  const envPath = path.join(ROOT, ".env.import.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*KRDICT_JSON_DIR\s*=\s*(.+?)\s*$/);
      if (m && existsSync(m[1])) return m[1];
    }
  }
  console.error(
    "\n❌ Cần thư mục JSON krdict đã giải nén (các file *_5000_*.json).\n" +
      "   Cách dùng: npm run import:ko -- /đường/dẫn/thư-mục-json\n",
  );
  process.exit(1);
}

const dir = resolveDir();
const lexicalEntries: unknown[] = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const doc = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  const le = doc?.LexicalResource?.Lexicon?.LexicalEntry;
  if (Array.isArray(le)) lexicalEntries.push(...le);
}
console.log(`Đã nạp ${lexicalEntries.length} mục krdict.`);

const raw = parseKrdictLmf(lexicalEntries);
const result = buildDatasetFromSeeds(readSeeds("ko"), raw, {
  language: "ko",
  level: "krdict-reference",
  syllabusVersion: "krdict-reference",
  sourceId: "krdict",
  idPrefix: "ko-krdict-",
  entryUrl: (e) =>
    e.entryId
      ? `https://krdict.korean.go.kr/dicSearch/SearchView?ParaWordNo=${e.entryId}`
      : undefined,
});

writeDataset(result, {
  sourceId: "krdict",
  outFile: "src/data/ko/generated/krdict.json",
  language: "ko",
});
