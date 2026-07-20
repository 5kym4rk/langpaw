/**
 * Importer krdict "cơ bản" (§7.1): nhập TẤT CẢ từ tiếng Hàn cấp 초급 (sơ cấp) và
 * 중급 (trung cấp) có sẵn nghĩa tiếng Việt CHÍNH THỨC (Viện Quốc ngữ Hàn Quốc).
 * Dùng bản tải JSON đầy đủ (LMF):
 *   npm run import:ko-basic -- /đường/dẫn/thư-mục-json
 *
 * Nghĩa Việt là bản dịch chính thức của krdict; vẫn để reviewStatus=draft cho
 * tới khi dự án rà soát. Câu ví dụ lấy từ krdict (tiếng Hàn); ví dụ tiếng Việt
 * để trống (chờ bổ sung) — được dashboard chất lượng gắn cờ.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { vocabularyDatasetSchema } from "../src/data/schema.ts";
import type {
  VocabularyItem,
  VocabularyDataset,
} from "../src/types/vocabulary.ts";
import { ROOT, SOURCES } from "./import-common.ts";
import { writeFileSync, mkdirSync } from "node:fs";

const dir = process.argv[2];
if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) {
  console.error("\n❌ Cần thư mục JSON krdict đã giải nén.\n");
  process.exit(1);
}

// -------- Tiện ích đọc LMF (feat có thể là object hoặc mảng) --------
type Node = Record<string, unknown>;
const arr = (x: unknown): Node[] =>
  Array.isArray(x) ? (x as Node[]) : x ? [x as Node] : [];
const feats = (n: unknown): Node[] =>
  n && typeof n === "object" ? arr((n as Node).feat) : [];
const fv = (n: unknown, att: string): string | undefined => {
  for (const f of feats(n)) if (f.att === att) return f.val as string;
  return undefined;
};

const KO_POS: Record<string, string> = {
  명사: "noun",
  동사: "verb",
  형용사: "adjective",
  부사: "adverb",
  대명사: "pronoun",
  관형사: "determiner",
  감탄사: "interjection",
  수사: "numeral",
  조사: "particle",
};
const LEVEL_LABEL: Record<string, string> = {
  초급: "Sơ cấp",
  중급: "Trung cấp",
};
/** Dịch nhóm chủ đề cấp cao của krdict sang tiếng Việt cho gọn/thống nhất. */
const TOPIC_MAP: Record<string, string> = {
  개념: "Khái niệm",
  "경제 생활": "Kinh tế",
  과학: "Khoa học – Kỹ thuật",
  교육: "Giáo dục",
  동식물: "Động – Thực vật",
  문화: "Văn hóa",
  "사회 생활": "Đời sống xã hội",
  삶: "Đời sống",
  스포츠: "Thể thao",
  식생활: "Ẩm thực",
  의생활: "Trang phục",
  인간: "Con người",
  자연: "Tự nhiên",
  "정치와 행정": "Chính trị – Hành chính",
  종교: "Tôn giáo",
  주생활: "Nhà ở",
};

const items: VocabularyItem[] = [];
const seenTerms = new Set<string>();
let idn = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const doc = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  const entries = doc?.LexicalResource?.Lexicon?.LexicalEntry;
  if (!Array.isArray(entries)) continue;

  for (const e of entries as Node[]) {
    const level = fv(e, "vocabularyLevel");
    if (level !== "초급" && level !== "중급") continue;

    const lemmaNode = arr(e.Lemma)[0];
    const term = fv(lemmaNode, "writtenForm");
    if (!term || seenTerms.has(term)) continue;

    const sense = arr(e.Sense)[0];
    if (!sense) continue;

    // Nghĩa + định nghĩa tiếng Việt chính thức.
    let viLemma: string | undefined;
    let viDef: string | undefined;
    let enLemma: string | undefined;
    for (const eq of arr(sense.Equivalent)) {
      const lang = fv(eq, "language");
      if (lang === "베트남어") {
        viLemma = fv(eq, "lemma");
        viDef = fv(eq, "definition");
      } else if (lang === "영어") {
        enLemma = fv(eq, "lemma");
      }
    }
    if (!viLemma) continue; // chỉ nhập mục có nghĩa tiếng Việt chính thức

    // Cách đọc (phát âm) từ WordForm type=발음.
    let reading: string | undefined;
    for (const wf of arr(e.WordForm)) {
      if (fv(wf, "type") === "발음") {
        reading = fv(wf, "pronunciation");
        break;
      }
    }
    // Câu ví dụ tiếng Hàn (nếu có).
    let example = "";
    for (const se of arr(sense.SenseExample)) {
      const ex = fv(se, "example");
      if (ex) {
        example = ex;
        break;
      }
    }

    const pos = fv(e, "partOfSpeech");
    const category = fv(e, "semanticCategory");
    const entryId = e.val as string; // att=id
    idn += 1;
    seenTerms.add(term);
    items.push({
      id: `ko-krdict-basic-${String(idn).padStart(5, "0")}`,
      language: "ko",
      term,
      reading,
      partOfSpeech: pos ? (KO_POS[pos] ?? pos) : undefined,
      meaningVi: viLemma,
      explanationVi: viDef ? `Định nghĩa (krdict): ${viDef}` : undefined,
      example,
      exampleVi: "",
      level: LEVEL_LABEL[level],
      syllabusVersion: "krdict-reference",
      topic: TOPIC_MAP[(category || "").split(" > ")[0]] || "Chung",
      tags: enLemma ? [`en:${enLemma}`] : [],
      isInterviewVocabulary: false,
      sourceIds: ["krdict"],
      sourceEntryId: entryId,
      sourceEntryUrl: entryId
        ? `https://krdict.korean.go.kr/dicSearch/SearchView?ParaWordNo=${entryId}`
        : undefined,
      definitionSourceLanguage: "ko",
      reviewStatus: "draft",
    });
  }
}

const dataset: VocabularyDataset = {
  language: "ko",
  level: "krdict-basic",
  syllabusVersion: "krdict-reference",
  sources: [SOURCES.krdict],
  items,
};

const parsed = vocabularyDatasetSchema.safeParse(dataset);
if (!parsed.success) {
  console.error("❌ Dataset không hợp lệ:", parsed.error.issues.slice(0, 8));
  process.exit(1);
}

const out = path.join(ROOT, "src/data/ko/generated/krdict-basic.json");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(
  `✅ Ghi ${items.length} mục Hàn (초급+중급) → src/data/ko/generated/krdict-basic.json`,
);
