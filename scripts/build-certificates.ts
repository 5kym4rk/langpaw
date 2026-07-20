/**
 * Gán cấp chứng chỉ cho toàn bộ từ điển bằng EXACT-MATCH với certificate index
 * (spec phân loại chứng chỉ). Tuyệt đối không dùng độ dài từ / vị trí / AI đoán.
 *
 *   npm run build:certs
 *
 * - Đọc 4 index trong src/data/certification/<lang>/.
 * - Ghi lại các dataset trong src/data/<lang>/ với certificateScheme/Level/
 *   Status/RequiresReview; item.level = displayLevel hoặc "Chưa phân loại".
 * - Xuất assignments-<lang>.json + docs/CERTIFICATION_REPORT.md.
 * - Kiểm tra: gán mâu thuẫn, POS lệch (en), reading lệch (ja), mục index không
 *   có trong từ điển, từ chưa phân loại.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  VocabularyItem,
  CertificateAssignment,
  CertificateScheme,
} from "../src/types/vocabulary.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(ROOT, "src/data");
const certDir = path.join(dataDir, "certification");

interface IndexFile {
  scheme: CertificateScheme;
  status: "official" | "reference";
  sourceId: string;
  sourceVersion: string;
  levels: string[];
  entries: Record<string, string>[];
}

const ROUTES: Record<
  string,
  { routeId: string; labelVi: string; file: string }
> = {
  en: {
    routeId: "cefr-reference",
    labelVi: "CEFR tham khảo",
    file: "en/cefr-j-index.json",
  },
  zh: {
    routeId: "hsk-3.0",
    labelVi: "HSK 3.0 chính thức",
    file: "zh/hsk3-index.json",
  },
  ja: {
    routeId: "jlpt-reference",
    labelVi: "JLPT tham khảo",
    file: "ja/jlpt-reference-index.json",
  },
  ko: {
    routeId: "nikl-learning",
    labelVi: "Từ vựng học tiếng Hàn NIKL",
    file: "ko/nikl-learning-index.json",
  },
};

const loadIndex = (lang: string): IndexFile =>
  JSON.parse(readFileSync(path.join(certDir, ROUTES[lang].file), "utf8"));

// Chuẩn hóa POS tiếng Anh giữa từ điển và CEFR-J.
const normPos = (p?: string): string =>
  (p ?? "").toLowerCase().replace(/\./g, "").trim();

function findJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findJsonFiles(full));
    else if (e.name.endsWith(".json")) out.push(full);
  }
  return out;
}

interface MatchResult {
  sourceLevel: string;
  displayLevel: string;
  matchType: CertificateAssignment["matchType"];
  confidence: number;
  requiresReview: boolean;
}

const report: string[] = [];
let hardErrors = 0;

for (const lang of ["en", "zh", "ja", "ko"] as const) {
  const idx = loadIndex(lang);
  const route = ROUTES[lang];
  const levelRank = new Map(idx.levels.map((l, i) => [l, i]));

  // ---- Dựng bảng tra theo ngôn ngữ ----
  // en: lemma -> [{pos, level}] ; ja: expression -> [{reading, level}]
  // zh/ko: term -> level (duy nhất; nếu trùng giữ cấp thấp nhất)
  const multi = new Map<string, Record<string, string>[]>();
  const single = new Map<string, string>();
  for (const e of idx.entries) {
    if (lang === "en") {
      const k = e.lemma;
      (multi.get(k) ?? multi.set(k, []).get(k)!).push(e);
    } else if (lang === "ja") {
      const k = e.expression;
      (multi.get(k) ?? multi.set(k, []).get(k)!).push(e);
    } else {
      const k = lang === "zh" ? e.simplified : e.term;
      const prev = single.get(k);
      if (!prev || levelRank.get(e.level)! < levelRank.get(prev)!) {
        single.set(k, e.level);
      }
    }
  }

  const match = (item: VocabularyItem): MatchResult | null => {
    if (lang === "zh" || lang === "ko") {
      const level = single.get(item.term);
      if (!level) return null;
      return {
        sourceLevel: level,
        displayLevel: level,
        matchType: "exact-term",
        confidence: 1,
        requiresReview: false,
      };
    }
    if (lang === "en") {
      const cands = multi.get(item.term.toLowerCase());
      if (!cands?.length) return null;
      const pos = normPos(item.partOfSpeech);
      const posHit = pos
        ? cands.find((c) => normPos(c.pos) === pos)
        : undefined;
      if (posHit) {
        return {
          sourceLevel: posHit.level,
          displayLevel: posHit.level,
          matchType: "lemma-pos",
          confidence: 1,
          requiresReview: false,
        };
      }
      const levels = [...new Set(cands.map((c) => c.level))];
      const lowest = levels.sort(
        (a, b) => levelRank.get(a)! - levelRank.get(b)!,
      )[0];
      // Một cấp duy nhất → chắc chắn; nhiều cấp (POS không rõ) → cần rà soát.
      return {
        sourceLevel: lowest,
        displayLevel: lowest,
        matchType: "exact-term",
        confidence: levels.length === 1 ? 0.9 : 0.6,
        requiresReview: levels.length > 1,
      };
    }
    // ja: expression + reading
    const cands = multi.get(item.term);
    if (!cands?.length) return null;
    const readingHit = item.reading
      ? cands.find((c) => c.reading === item.reading)
      : undefined;
    if (readingHit) {
      return {
        sourceLevel: readingHit.level,
        displayLevel: readingHit.level,
        matchType: "term-reading",
        confidence: 1,
        requiresReview: false,
      };
    }
    const levels = [...new Set(cands.map((c) => c.level))];
    if (levels.length > 1) return null; // nhiều cấp mâu thuẫn → review queue, KHÔNG gán
    // Không có reading khớp nhưng cấp duy nhất → gán kèm cờ rà soát (spec).
    return {
      sourceLevel: levels[0],
      displayLevel: levels[0],
      matchType: "exact-term",
      confidence: 0.7,
      requiresReview: true,
    };
  };

  // ---- Quét & ghi lại dataset ----
  const files = findJsonFiles(path.join(dataDir, lang));
  const assignments: CertificateAssignment[] = [];
  const reviewQueue: { id: string; term: string; reason: string }[] = [];
  const matchedTerms = new Set<string>();
  let total = 0;
  let exact = 0;
  let review = 0;
  let unclassified = 0;
  const byLevel = new Map<string, number>();
  const byTopic = new Map<string, number>();

  for (const file of files) {
    const doc = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(doc.items)) continue;
    for (const item of doc.items as VocabularyItem[]) {
      total += 1;
      const m = match(item);
      if (m) {
        item.certificateScheme = idx.scheme;
        item.certificateLevel = m.displayLevel;
        item.certificateStatus = idx.status;
        item.certificateRequiresReview = m.requiresReview || undefined;
        item.level = m.displayLevel;
        matchedTerms.add(lang === "en" ? item.term.toLowerCase() : item.term);
        assignments.push({
          dictionaryItemId: item.id,
          routeId: route.routeId,
          scheme: idx.scheme,
          sourceLevel: m.sourceLevel,
          displayLevel: m.displayLevel,
          sourceId: idx.sourceId,
          sourceVersion: idx.sourceVersion,
          matchType: m.matchType,
          status: idx.status,
          confidence: m.confidence,
          requiresReview: m.requiresReview,
        });
        exact += 1;
        if (m.requiresReview) {
          review += 1;
          reviewQueue.push({
            id: item.id,
            term: item.term,
            reason:
              lang === "en"
                ? "POS không khớp / nhiều cấp CEFR"
                : "Thiếu reading khớp với index JLPT",
          });
        }
        byLevel.set(m.displayLevel, (byLevel.get(m.displayLevel) ?? 0) + 1);
        byTopic.set(item.topic, (byTopic.get(item.topic) ?? 0) + 1);
      } else {
        item.certificateScheme = undefined;
        item.certificateLevel = null;
        item.certificateStatus = "unclassified";
        item.certificateRequiresReview = undefined;
        item.level = "Chưa phân loại";
        unclassified += 1;
        if (lang === "ja" && multi.has(item.term)) {
          reviewQueue.push({
            id: item.id,
            term: item.term,
            reason: "Cùng chữ nhưng nhiều cấp/reading mâu thuẫn trong index",
          });
        }
      }
    }
    writeFileSync(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  }

  // Mục index không xuất hiện trong từ điển (thông tin, không chặn).
  const indexKeys =
    lang === "en" || lang === "ja" ? [...multi.keys()] : [...single.keys()];
  const notInDict = indexKeys.filter((k) => !matchedTerms.has(k)).length;

  writeFileSync(
    path.join(certDir, `assignments-${lang}.json`),
    JSON.stringify(assignments, null, 1) + "\n",
    "utf8",
  );
  writeFileSync(
    path.join(certDir, `review-${lang}.json`),
    JSON.stringify(reviewQueue, null, 1) + "\n",
    "utf8",
  );

  const levelLines = idx.levels
    .filter((l) => byLevel.has(l))
    .map((l) => `  - ${l}: ${byLevel.get(l)}`)
    .join("\n");
  const learningReady = exact - review;
  report.push(
    [
      `## ${lang.toUpperCase()} — ${route.labelVi} (${idx.status})`,
      ``,
      `- Nguồn: ${idx.sourceVersion}`,
      `- Tổng từ trong kho: ${total}`,
      `- Exact matched: ${exact}`,
      `- Requires review: ${review}`,
      `- Unclassified: ${unclassified}`,
      `- Learning ready (matched, không cần rà soát): ${learningReady}`,
      `- Mục index chưa có trong từ điển: ${notInDict}`,
      `- Theo cấp:`,
      levelLines,
    ].join("\n"),
  );
  console.log(
    `${lang}: matched ${exact}/${total} (review ${review}, unclassified ${unclassified})`,
  );

  // Validation cứng: một item hai cấp khác nhau là bug ghép.
  const seen = new Map<string, string>();
  for (const a of assignments) {
    const prev = seen.get(a.dictionaryItemId);
    if (prev && prev !== a.displayLevel) {
      console.error(
        `❌ [${lang}] ${a.dictionaryItemId} gán 2 cấp: ${prev} vs ${a.displayLevel}`,
      );
      hardErrors += 1;
    }
    seen.set(a.dictionaryItemId, a.displayLevel);
  }
}

writeFileSync(
  path.join(ROOT, "docs/CERTIFICATION_REPORT.md"),
  `# Báo cáo phân loại chứng chỉ\n\nSinh bởi \`npm run build:certs\` — exact-match với certificate index, không dùng độ dài từ/vị trí/AI đoán.\n\n${report.join("\n\n")}\n`,
  "utf8",
);
console.log("→ docs/CERTIFICATION_REPORT.md");
if (hardErrors > 0) process.exit(1);
