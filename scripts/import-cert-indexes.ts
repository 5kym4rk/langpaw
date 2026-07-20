/**
 * Dựng 4 certificate index (spec phân loại chứng chỉ):
 *   npm run import:certs -- <cefrj.csv> <octanove.csv> <hsk30-wordlist.txt> <jlpt-dir> <krdict-json-dir>
 *
 * - en  CEFR-J 1.5 + Octanove C1/C2 (CC BY)      → cefr-j-index.json
 * - zh  HSK 3.0 / GF0025-2021 (mirror Pleco MIT)  → hsk3-index.json
 * - ja  elzup/jlpt-word-list (tham khảo)          → jlpt-reference-index.json
 * - ko  한국어기초사전 (NIKL) vocabularyLevel      → nikl-learning-index.json
 *
 * Chỉ dựng index; việc GÁN cấp cho từ điển do scripts/build-certificates.ts
 * đảm nhiệm bằng exact-match (không đoán, không xếp theo độ dài).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = (lang: string) => {
  const d = path.join(ROOT, "src/data/certification", lang);
  mkdirSync(d, { recursive: true });
  return d;
};

const [cefrjCsv, octanoveCsv, hskTxt, jlptDir, krdictDir] =
  process.argv.slice(2);
if (!cefrjCsv || !octanoveCsv || !hskTxt || !jlptDir || !krdictDir) {
  console.error(
    "Cách dùng: npm run import:certs -- <cefrj.csv> <octanove.csv> <hsk30.txt> <jlpt-dir> <krdict-dir>",
  );
  process.exit(1);
}

// ---------------- EN: CEFR-J + Octanove ----------------
// Quy đổi cấp con: A1.1/2/3→A1, A2.1/2→A2, B1.1/2→B1, B2.1/2→B2.
const foldCefr = (lv: string): string =>
  lv.replace(/^(A1|A2|B1|B2)\.\d$/, "$1");

interface EnEntry {
  lemma: string;
  pos: string;
  level: string;
}
const enEntries: EnEntry[] = [];
const parseCefrCsv = (file: string) => {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines.slice(1)) {
    // CSV đơn giản: headword,pos,CEFR,... (headword có thể chứa "a/b" biến thể)
    const cols = line.split(",");
    if (cols.length < 3) continue;
    const [head, pos, cefr] = cols;
    const level = foldCefr((cefr ?? "").trim());
    if (!head || !level || !/^(Pre-A1|A1|A2|B1|B2|C1|C2)$/.test(level))
      continue;
    for (const variant of head.split("/")) {
      const lemma = variant.trim().toLowerCase();
      if (lemma) enEntries.push({ lemma, pos: (pos ?? "").trim(), level });
    }
  }
};
parseCefrCsv(cefrjCsv);
parseCefrCsv(octanoveCsv);
writeFileSync(
  path.join(outDir("en"), "cefr-j-index.json"),
  JSON.stringify(
    {
      scheme: "CEFR-J",
      status: "reference",
      sourceId: "cefr-j-olp",
      sourceVersion: "CEFR-J 1.5 + Octanove C1/C2 1.0",
      sourceUrl: "https://github.com/openlanguageprofiles/olp-en-cefrj",
      license: "CC BY 4.0",
      note: "Phân cấp tham khảo theo CEFR (CEFR-J) — không phải danh sách CEFR chính thức.",
      levels: ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"],
      entries: enEntries,
    },
    null,
    1,
  ) + "\n",
);
console.log(`en: ${enEntries.length} mục CEFR-J/Octanove`);

// ---------------- ZH: HSK 3.0 (TSV có pinyin) ----------------
// hskTxt giờ là THƯ MỤC chứa hsk-tsv-{1..6,7-9}.tsv (krmanik/HSK-3.0):
// cột 1 giản thể, cột 2 phồn thể, cột 3 pinyin (HTML). Chuẩn hóa pinyin để
// match sense (spec III.2) — mặt chữ đơn thuần không đủ.
import { normalizePinyin } from "../src/services/classification/certificate-matcher.ts";

interface ZhEntry {
  simplified: string;
  traditional?: string;
  pinyin?: string;
  level: string;
}
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").trim();
const zhEntries: ZhEntry[] = [];
const ZH_LEVELS: [string, string][] = [
  ["1", "HSK 1"],
  ["2", "HSK 2"],
  ["3", "HSK 3"],
  ["4", "HSK 4"],
  ["5", "HSK 5"],
  ["6", "HSK 6"],
  ["7-9", "HSK 7–9"],
];
for (const [suffix, level] of ZH_LEVELS) {
  const file = path.join(hskTxt, `hsk-tsv-${suffix}.tsv`);
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const cols = line.split("\t");
    if (cols.length < 3) continue;
    const simplified = cols[0].trim();
    if (!/^[一-鿿]+$/.test(simplified)) continue;
    const traditional = cols[1].trim() || undefined;
    const pinyinRaw = stripHtml(cols[2].replace(/^"|"$/g, ""));
    zhEntries.push({
      simplified,
      traditional,
      pinyin: pinyinRaw ? normalizePinyin(pinyinRaw) : undefined,
      level,
    });
  }
}
writeFileSync(
  path.join(outDir("zh"), "hsk3-index.json"),
  JSON.stringify(
    {
      scheme: "HSK-3.0",
      // Tiêu chuẩn là chính thức; DỮ LIỆU nhập là bản chép của cộng đồng —
      // không gộp hai khái niệm (spec X).
      status: "official",
      standardAuthority: "GF0025-2021 (Bộ Giáo dục Trung Quốc / CLEC)",
      dataDistributor:
        "krmanik/HSK-3.0 (bản chép cộng đồng, kèm pinyin) + elkmovie/hsk30 (OCR Pleco, MIT)",
      sourceId: "hsk30-gf0025",
      sourceVersion: "GF0025-2021 — community transcription 2021",
      sourceUrl: "https://github.com/krmanik/HSK-3.0",
      license: "Theo repo nguồn (tham chiếu tiêu chuẩn GF0025-2021)",
      note: "Phân cấp theo HSK 3.0 / GF0025-2021; dữ liệu nhập từ bản chép cộng đồng, không phải bản phát hành chính thức.",
      levels: ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6", "HSK 7–9"],
      entries: zhEntries,
    },
    null,
    1,
  ) + "\n",
);
console.log(`zh: ${zhEntries.length} mục HSK 3.0 (có pinyin)`);

// ---------------- JA: JLPT reference ----------------
interface JaEntry {
  expression: string;
  reading: string;
  level: string;
}
const jaEntries: JaEntry[] = [];
for (const n of ["n5", "n4", "n3", "n2", "n1"]) {
  const file = path.join(jlptDir, `jlpt-${n}.csv`);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines.slice(1)) {
    // CSV: expression,reading,meaning(có thể chứa dấu phẩy trong ngoặc kép),tags
    const m = line.match(/^([^,]*),([^,]*),/);
    if (!m) continue;
    const expression = m[1].trim();
    const reading = m[2].trim();
    if (!expression) continue;
    jaEntries.push({ expression, reading, level: n.toUpperCase() });
  }
}
writeFileSync(
  path.join(outDir("ja"), "jlpt-reference-index.json"),
  JSON.stringify(
    {
      scheme: "JLPT-REFERENCE",
      status: "reference",
      sourceId: "jlpt-elzup",
      sourceVersion: "elzup/jlpt-word-list",
      sourceUrl: "https://github.com/elzup/jlpt-word-list",
      license: "Xem repo nguồn",
      note: "Danh sách tham khảo JLPT — JLPT không công bố danh sách từ chính thức.",
      levels: ["N5", "N4", "N3", "N2", "N1"],
      entries: jaEntries,
    },
    null,
    1,
  ) + "\n",
);
console.log(`ja: ${jaEntries.length} mục JLPT tham khảo`);

// ---------------- KO: NIKL (한국어기초사전 vocabularyLevel) ----------------
type Node = Record<string, unknown>;
const arr = (x: unknown): Node[] =>
  Array.isArray(x) ? (x as Node[]) : x ? [x as Node] : [];
const feats = (n: unknown): Node[] =>
  n && typeof n === "object" ? arr((n as Node).feat) : [];
const fv = (n: unknown, att: string): string | undefined => {
  for (const f of feats(n)) if (f.att === att) return f.val as string;
  return undefined;
};
const KO_LEVEL: Record<string, string> = { 초급: "A", 중급: "B", 고급: "C" };
interface KoEntry {
  term: string;
  level: string;
  pos?: string;
  entryId?: string;
}
// Giữ MỌI entry (kể cả homonym) kèm entryId + POS để match ngữ nghĩa —
// KHÔNG gộp lấy cấp thấp nhất (spec III.4).
const koEntries: KoEntry[] = [];
for (const f of readdirSync(krdictDir).filter((x) => x.endsWith(".json"))) {
  const doc = JSON.parse(readFileSync(path.join(krdictDir, f), "utf8"));
  for (const e of arr(doc?.LexicalResource?.Lexicon?.LexicalEntry)) {
    const lv = KO_LEVEL[fv(e, "vocabularyLevel") ?? ""];
    if (!lv) continue;
    const term = fv(arr(e.Lemma)[0], "writtenForm");
    if (!term) continue;
    koEntries.push({
      term,
      level: lv,
      pos: fv(e, "partOfSpeech"),
      entryId: (e as Node).val as string,
    });
  }
}
writeFileSync(
  path.join(outDir("ko"), "nikl-learning-index.json"),
  JSON.stringify(
    {
      scheme: "NIKL-LEARNING",
      status: "reference",
      sourceId: "krdict-nikl-level",
      sourceVersion: "한국어기초사전 JSON 20260719 (vocabularyLevel)",
      sourceUrl: "https://krdict.korean.go.kr/",
      license: "Theo điều khoản krdict",
      note: "Phân cấp học tiếng Hàn của NIKL (초급/중급/고급 → A/B/C). Không quy đổi sang TOPIK.",
      levels: ["A", "B", "C"],
      entries: koEntries,
    },
    null,
    1,
  ) + "\n",
);
console.log(`ko: ${koEntries.length} mục NIKL A/B/C`);
