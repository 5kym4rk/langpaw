/**
 * Gán cấp chứng chỉ bằng match CÓ NGỮ NGHĨA (spec P0-II/III):
 * exact-match mặt chữ chưa đủ — kiểm thêm POS (en), pinyin+sense (zh),
 * reading chuẩn hóa (ja), entryId/homonym (ko). Tính learningReady thật.
 *
 *   npm run build:certs
 *
 * Ghi lại dataset (certificate fields, learningReady, senseMismatch,
 * invalidMeaning), xuất assignments/review/summary + LEARNING_DATA_REPORT.md.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  VocabularyItem,
  CertificateAssignment,
  CertificateScheme,
} from "../src/types/vocabulary.ts";
import {
  matchEnglish,
  matchChinese,
  matchJapanese,
  matchKorean,
  isInvalidMeaningVi,
  normalizeKana,
  type MatchOutcome,
  type EnIndexEntry,
  type ZhIndexEntry,
  type JaIndexEntry,
  type KoIndexEntry,
} from "../src/services/classification/certificate-matcher.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(ROOT, "src/data");
const certDir = path.join(dataDir, "certification");

interface IndexFile {
  scheme: CertificateScheme;
  status: "official" | "reference";
  sourceId: string;
  sourceVersion: string;
  sourceUrl?: string;
  license?: string;
  standardAuthority?: string;
  dataDistributor?: string;
  levels: string[];
  entries: Record<string, string | undefined>[];
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
    labelVi: "Phân cấp theo HSK 3.0 / GF0025-2021",
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

function findJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findJsonFiles(full));
    else if (e.name.endsWith(".json")) out.push(full);
  }
  return out;
}

interface LangStats {
  total: number;
  matched: number;
  requiresReview: number;
  learningReady: number;
  unclassified: number;
  invalidMeaning: number;
  missingReading: number;
  senseMismatch: number;
  byLevel: Map<string, number>;
  readyByLevel: Map<string, number>;
}

const report: string[] = [];
const summary: Record<string, unknown>[] = [];
const rejectedExamples: string[] = [];
let hardErrors = 0;

const READING_REQUIRED = new Set(["zh", "ja", "ko"]);

for (const lang of ["en", "zh", "ja", "ko"] as const) {
  const idx: IndexFile = JSON.parse(
    readFileSync(path.join(certDir, ROUTES[lang].file), "utf8"),
  );
  const route = ROUTES[lang];
  const levelRank = new Map(idx.levels.map((l, i) => [l, i]));

  // Bảng tra theo khóa mặt chữ (giá trị: mọi candidate — giữ homonym).
  const table = new Map<string, Record<string, string | undefined>[]>();
  const keyOf = (e: Record<string, string | undefined>): string =>
    lang === "en"
      ? (e.lemma as string)
      : lang === "zh"
        ? (e.simplified as string)
        : lang === "ja"
          ? (e.expression as string)
          : (e.term as string);
  for (const e of idx.entries) {
    const k = keyOf(e);
    if (!k) continue;
    (table.get(k) ?? table.set(k, []).get(k)!).push(e);
  }

  const match = (item: VocabularyItem): MatchOutcome | null => {
    if (lang === "en") {
      return matchEnglish(
        item.term,
        item.partOfSpeech,
        table.get(item.term.toLowerCase()) as EnIndexEntry[] | undefined,
        levelRank,
      );
    }
    if (lang === "zh") {
      return matchChinese(
        item.term,
        item.romanization ?? item.reading,
        item.meaningVi,
        table.get(item.term) as ZhIndexEntry[] | undefined,
      );
    }
    if (lang === "ja") {
      return matchJapanese(
        item.term,
        item.reading,
        table.get(item.term) as JaIndexEntry[] | undefined,
      );
    }
    return matchKorean(
      item.term,
      item.sourceEntryId,
      undefined, // POS từ điển là nhãn EN đã map; entryId là kênh chính
      table.get(item.term) as KoIndexEntry[] | undefined,
    );
  };

  const st: LangStats = {
    total: 0,
    matched: 0,
    requiresReview: 0,
    learningReady: 0,
    unclassified: 0,
    invalidMeaning: 0,
    missingReading: 0,
    senseMismatch: 0,
    byLevel: new Map(),
    readyByLevel: new Map(),
  };
  const assignments: CertificateAssignment[] = [];
  const reviewQueue: { id: string; term: string; reason: string }[] = [];

  for (const file of findJsonFiles(path.join(dataDir, lang))) {
    const doc = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(doc.items)) continue;
    for (const item of doc.items as VocabularyItem[]) {
      st.total += 1;

      const invalidMeaning = isInvalidMeaningVi(item.meaningVi);
      const missingReading =
        READING_REQUIRED.has(lang) &&
        !(item.reading || item.romanization) &&
        // kana thuần tự làm reading cho ja
        !(
          lang === "ja" &&
          !/[一-鿿]/.test(item.term) &&
          normalizeKana(item.term)
        );
      if (invalidMeaning) st.invalidMeaning += 1;
      if (missingReading) st.missingReading += 1;

      const m = match(item);
      if (m) {
        st.matched += 1;
        if (m.requiresReview) st.requiresReview += 1;
        if (m.senseMismatch) st.senseMismatch += 1;

        const ready =
          !m.requiresReview &&
          !m.senseMismatch &&
          !invalidMeaning &&
          !missingReading;

        item.certificateScheme = idx.scheme;
        item.certificateLevel = m.level;
        item.certificateStatus = idx.status;
        item.certificateRequiresReview = m.requiresReview || undefined;
        item.senseMismatch = m.senseMismatch || undefined;
        item.invalidMeaning = invalidMeaning || undefined;
        item.learningReady = ready;
        item.level = m.level;

        if (ready) {
          st.learningReady += 1;
          st.readyByLevel.set(m.level, (st.readyByLevel.get(m.level) ?? 0) + 1);
        }
        st.byLevel.set(m.level, (st.byLevel.get(m.level) ?? 0) + 1);

        assignments.push({
          dictionaryItemId: item.id,
          routeId: route.routeId,
          scheme: idx.scheme,
          sourceLevel: m.level,
          displayLevel: m.level,
          sourceId: idx.sourceId,
          sourceVersion: idx.sourceVersion,
          matchType: m.matchType,
          status: idx.status,
          confidence: m.confidence,
          requiresReview: m.requiresReview,
        });
        if (m.requiresReview || m.senseMismatch) {
          const reason = m.senseMismatch
            ? "Sense khác với sense của index (pinyin/nghĩa hiếm)"
            : lang === "en"
              ? "Nhiều POS/cấp, POS từ điển chưa xác minh"
              : lang === "ja"
                ? "Reading không khớp/thiếu so với index"
                : "Homonym nhiều cấp, thiếu entryId khớp";
          reviewQueue.push({ id: item.id, term: item.term, reason });
          if (rejectedExamples.length < 40) {
            rejectedExamples.push(
              `- [${lang}] ${item.term} (${item.id}): ${reason} — meaningVi="${item.meaningVi.slice(0, 50)}"`,
            );
          }
        } else if (invalidMeaning && rejectedExamples.length < 40) {
          rejectedExamples.push(
            `- [${lang}] ${item.term} (${item.id}): nghĩa không đủ chất lượng — "${item.meaningVi.slice(0, 50)}"`,
          );
        }
      } else {
        st.unclassified += 1;
        item.certificateScheme = undefined;
        item.certificateLevel = null;
        item.certificateStatus = "unclassified";
        item.certificateRequiresReview = undefined;
        item.senseMismatch = undefined;
        item.invalidMeaning = invalidMeaning || undefined;
        item.learningReady = false;
        item.level = "Chưa phân loại";
      }
    }
    writeFileSync(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  }

  writeFileSync(
    path.join(certDir, `assignments-${lang}.json`),
    JSON.stringify(assignments, null, 1) + "\n",
  );
  writeFileSync(
    path.join(certDir, `review-${lang}.json`),
    JSON.stringify(reviewQueue, null, 1) + "\n",
  );

  summary.push({
    language: lang,
    routeId: route.routeId,
    labelVi: route.labelVi,
    scheme: idx.scheme,
    status: idx.status,
    standardAuthority: idx.standardAuthority,
    dataDistributor: idx.dataDistributor,
    sourceVersion: idx.sourceVersion,
    sourceUrl: idx.sourceUrl,
    license: idx.license,
    indexEntries: idx.entries.length,
    total: st.total,
    matched: st.matched,
    requiresReview: st.requiresReview,
    learningReady: st.learningReady,
    unclassified: st.unclassified,
    invalidMeaning: st.invalidMeaning,
    missingReading: st.missingReading,
    senseMismatch: st.senseMismatch,
  });

  const levelLines = idx.levels
    .filter((l) => st.byLevel.has(l))
    .map(
      (l) =>
        `  - ${l}: ${st.byLevel.get(l)} khớp / ${st.readyByLevel.get(l) ?? 0} learning-ready`,
    )
    .join("\n");
  report.push(
    [
      `## ${lang.toUpperCase()} — ${route.labelVi} (${idx.status})`,
      ``,
      `| Chỉ số | Số lượng |`,
      `| --- | --- |`,
      `| Tổng kho từ | ${st.total} |`,
      `| Khớp certificate | ${st.matched} |`,
      `| Learning ready | ${st.learningReady} |`,
      `| Requires review | ${st.requiresReview} |`,
      `| Sense mismatch | ${st.senseMismatch} |`,
      `| Invalid meaning | ${st.invalidMeaning} |`,
      `| Missing reading | ${st.missingReading} |`,
      `| Ngoài lộ trình (unclassified) | ${st.unclassified} |`,
      ``,
      `Theo cấp (khớp / learning-ready):`,
      levelLines,
    ].join("\n"),
  );
  console.log(
    `${lang}: matched ${st.matched}/${st.total} · ready ${st.learningReady} · review ${st.requiresReview} · sense ${st.senseMismatch} · invalid ${st.invalidMeaning}`,
  );

  // Hard check: learningReady=true mà vi phạm điều kiện là bug.
  for (const file of findJsonFiles(path.join(dataDir, lang))) {
    const doc = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(doc.items)) continue;
    for (const it of doc.items as VocabularyItem[]) {
      if (
        it.learningReady &&
        (it.certificateRequiresReview ||
          it.senseMismatch ||
          it.invalidMeaning ||
          !it.certificateLevel)
      ) {
        console.error(
          `❌ [${lang}] ${it.id} learningReady nhưng vi phạm điều kiện`,
        );
        hardErrors += 1;
      }
    }
  }
}

writeFileSync(
  path.join(certDir, "summary.json"),
  JSON.stringify(summary, null, 1) + "\n",
);

writeFileSync(
  path.join(ROOT, "docs/LEARNING_DATA_REPORT.md"),
  [
    `# Báo cáo dữ liệu học (learning data)`,
    ``,
    `Sinh bởi \`npm run build:certs\`. Match có ngữ nghĩa: POS (en), pinyin+sense (zh), reading chuẩn hóa (ja), entryId/homonym (ko). learningReady chỉ true khi: có cấp + nghĩa hợp lệ + có cách đọc (zh/ja/ko) + không cần rà soát + không sense mismatch.`,
    ``,
    report.join("\n\n"),
    ``,
    `## Ví dụ mục bị loại khỏi learning-ready (và lý do)`,
    ``,
    rejectedExamples.join("\n"),
    ``,
  ].join("\n"),
);
console.log("→ docs/LEARNING_DATA_REPORT.md + summary.json");
if (hardErrors > 0) process.exit(1);
