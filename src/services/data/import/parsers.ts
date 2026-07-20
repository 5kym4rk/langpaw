/**
 * Parser thuần cho các nguồn từ điển có giấy phép (§5–8) và bộ dựng dataset
 * draft từ "seed" do dự án tự biên soạn. Không phụ thuộc Node/fetch để test
 * được bằng fixture nhỏ. Lớp CLI trong scripts/import-*.ts chịu trách nhiệm
 * đọc file và gọi các hàm này.
 *
 * Nguyên tắc dữ liệu (§4, §30):
 * - Nghĩa Việt và ví dụ luôn do dự án biên soạn (seed) và là `draft`.
 * - Chỉ lấy thông tin gốc (headword, cách đọc, POS, gloss, entry id) từ nguồn.
 * - Không tự nâng trạng thái lên verified.
 */

import type { LanguageCode, VocabularyDataset, VocabularyItem } from "@/types";

/** Bản ghi thô rút từ nguồn từ điển cho một headword. */
export interface RawEntry {
  term: string;
  reading?: string; // kana / Hangul đọc
  romanization?: string; // pinyin số / romaja
  ipa?: string; // phiên âm IPA (vd WordNet)
  partOfSpeech?: string;
  glossEn?: string; // định nghĩa/nghĩa tiếng Anh ở nguồn
  entryId?: string; // id entry trong nguồn (synset, ent_seq…)
}

/** Mục seed do dự án biên soạn: nghĩa Việt + ví dụ (draft). */
export interface VocabularySeed {
  /** Headword để tra trong nguồn (giản thể với zh, kanji/kana với ja…). */
  term: string;
  meaningVi: string;
  example: string;
  exampleVi: string;
  level: string;
  topic: string;
  tags?: string[];
  /** Ghi đè cách đọc nếu nguồn không có hoặc cần chuẩn hóa (vd pinyin dấu). */
  reading?: string;
  partOfSpeech?: string;
}

// ---------------------------------------------------------------------------
// CC-CEDICT (§6.1) — CC BY-SA 4.0
// Định dạng dòng: 電壓 电压 [dian4 ya1] /voltage/ ...
// ---------------------------------------------------------------------------

/** Chuyển pinyin số (dian4 ya1) sang có dấu thanh (diànyā). */
export function pinyinNumbersToMarks(numbered: string): string {
  const toneMarks: Record<string, string[]> = {
    a: ["a", "ā", "á", "ǎ", "à", "a"],
    e: ["e", "ē", "é", "ě", "è", "e"],
    i: ["i", "ī", "í", "ǐ", "ì", "i"],
    o: ["o", "ō", "ó", "ǒ", "ò", "o"],
    u: ["u", "ū", "ú", "ǔ", "ù", "u"],
    ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ", "ü"],
  };
  const applyTone = (syllable: string): string => {
    const m = syllable.match(/^([a-zü:]+?)([1-5])$/i);
    if (!m) return syllable.replace(/u:/g, "ü");
    let base = m[1].toLowerCase().replace(/u:/g, "ü");
    const tone = Number(m[2]);
    // Quy tắc đặt dấu: a/e ưu tiên; ou → o; nếu không, nguyên âm cuối.
    let target = -1;
    if (base.includes("a")) target = base.indexOf("a");
    else if (base.includes("e")) target = base.indexOf("e");
    else if (base.includes("ou")) target = base.indexOf("o");
    else {
      for (let i = base.length - 1; i >= 0; i -= 1) {
        if ("aeiouü".includes(base[i])) {
          target = i;
          break;
        }
      }
    }
    if (target < 0) return base;
    const ch = base[target];
    const marked = toneMarks[ch]?.[tone] ?? ch;
    base = base.slice(0, target) + marked + base.slice(target + 1);
    return base;
  };
  return numbered
    .trim()
    .split(/\s+/)
    .map(applyTone)
    .join("")
    .replace(/u:/g, "ü");
}

/** Phân tích nội dung CC-CEDICT thành Map giản-thể → RawEntry. */
export function parseCcCedict(text: string): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    // 電壓 电压 [dian4 ya1] /voltage/def2/
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]*)\]\s+\/(.*)\/\s*$/);
    if (!m) continue;
    const [, traditional, simplified, pinyinNum, glosses] = m;
    if (map.has(simplified)) continue; // giữ nghĩa đầu tiên
    map.set(simplified, {
      term: simplified,
      reading: pinyinNumbersToMarks(pinyinNum),
      romanization: pinyinNum.trim(),
      glossEn: glosses.split("/").filter(Boolean).slice(0, 3).join("; "),
      entryId: `${traditional}|${simplified}`,
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Open English WordNet (§5.1) — CC BY 4.0
// Định dạng JSON (english-wordnet-*.json): lemma → synset(s).
// Chấp nhận nhiều biến thể cấu trúc; ta chỉ cần lemma, pos, definition, id.
// ---------------------------------------------------------------------------

interface WordNetSynsetLike {
  id?: string;
  ili?: string;
  partOfSpeech?: string;
  pos?: string;
  definition?: string | string[];
  members?: string[];
  lemmas?: string[];
}

/**
 * Phân tích WordNet JSON dạng { synsets: [...] } hoặc mảng synset.
 * Trả về Map lemma(thường) → RawEntry (lấy synset đầu tiên cho mỗi lemma).
 */
export function parseWordNetJson(json: unknown): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  const synsets: WordNetSynsetLike[] = Array.isArray(json)
    ? (json as WordNetSynsetLike[])
    : ((json as { synsets?: WordNetSynsetLike[] })?.synsets ?? []);

  const posLabel: Record<string, string> = {
    n: "noun",
    v: "verb",
    a: "adjective",
    r: "adverb",
    s: "adjective",
  };

  for (const syn of synsets) {
    const def = Array.isArray(syn.definition)
      ? syn.definition[0]
      : syn.definition;
    const pos = syn.partOfSpeech ?? syn.pos;
    const members = syn.members ?? syn.lemmas ?? [];
    for (const lemmaRaw of members) {
      const lemma = String(lemmaRaw).toLowerCase();
      if (map.has(lemma)) continue;
      map.set(lemma, {
        term: lemmaRaw,
        partOfSpeech: pos ? (posLabel[pos] ?? pos) : undefined,
        glossEn: def,
        entryId: syn.id ?? syn.ili,
      });
    }
  }
  return map;
}

/** Nhãn POS đầy đủ từ mã một ký tự của WordNet. */
const WN_POS: Record<string, string> = {
  n: "noun",
  v: "verb",
  a: "adjective",
  r: "adverb",
  s: "adjective",
};

interface WN2025Entry {
  [pos: string]: {
    pronunciation?: { value: string }[];
    sense?: { id: string; synset: string }[];
  };
}

interface WN2025Synset {
  definition?: string[];
  partOfSpeech?: string;
  members?: string[];
}

/**
 * Định dạng Open English WordNet 2025 (nhiều file): `entries-*.json` ánh xạ
 * lemma → pos → {pronunciation, sense[{synset}]}; định nghĩa nằm ở các file
 * synset (`noun.*`, `verb.*`…). Hàm nhận hai bảng đã gộp và trả Map lemma →
 * RawEntry (lấy nghĩa đầu tiên). Pure function.
 */
export function parseWordNet2025(
  entries: Record<string, WN2025Entry>,
  synsets: Record<string, WN2025Synset>,
): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  for (const [lemma, byPos] of Object.entries(entries)) {
    const pos = Object.keys(byPos)[0];
    if (!pos) continue;
    const block = byPos[pos];
    const synsetId = block.sense?.[0]?.synset;
    const def = synsetId ? synsets[synsetId]?.definition?.[0] : undefined;
    map.set(lemma.toLowerCase(), {
      term: lemma,
      ipa: block.pronunciation?.[0]?.value,
      partOfSpeech: WN_POS[pos] ?? pos,
      glossEn: def,
      entryId: synsetId,
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// JMdict (§8.1) — CC BY-SA 4.0. XML lớn; ta rút gọn bằng regex theo <entry>.
// ---------------------------------------------------------------------------

/**
 * Phân tích JMdict XML thành Map (kanji hoặc kana) → RawEntry.
 * Lấy: kanji (keb) đầu, kana (reb) đầu, ent_seq, pos đầu, gloss tiếng Anh đầu.
 * Bỏ qua entry chỉ có tên riêng (không phù hợp học cơ bản) khi thiếu gloss.
 */
export function parseJmdict(xml: string): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  const first = (block: string, tag: string): string | undefined => {
    const mm = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return mm ? mm[1].trim() : undefined;
  };
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const entSeq = first(block, "ent_seq");
    const keb = first(block, "keb");
    const reb = first(block, "reb");
    const gloss = first(block, "gloss");
    const pos = first(block, "pos")?.replace(/&|;/g, "").trim();
    if (!reb || !gloss) continue;
    const term = keb ?? reb;
    const entry: RawEntry = {
      term,
      reading: keb ? reb : undefined,
      partOfSpeech: pos,
      glossEn: gloss,
      entryId: entSeq,
    };
    if (!map.has(term)) map.set(term, entry);
    if (keb && !map.has(reb)) map.set(reb, entry); // cho phép tra bằng kana
  }
  return map;
}

// ---------------------------------------------------------------------------
// krdict (§7.1) — Korean Basic Dictionary API (JSON đã chuẩn hóa).
// Script tải qua HTTP rồi đưa mảng item vào đây.
// ---------------------------------------------------------------------------

export interface KrdictItem {
  word: string;
  pronunciation?: string;
  romanization?: string;
  pos?: string;
  senseEn?: string;
  targetCode?: string; // entry id của krdict
}

export function parseKrdict(items: KrdictItem[]): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  for (const it of items) {
    if (!it.word || map.has(it.word)) continue;
    map.set(it.word, {
      term: it.word,
      reading: it.pronunciation,
      romanization: it.romanization,
      partOfSpeech: it.pos,
      glossEn: it.senseEn,
      entryId: it.targetCode,
    });
  }
  return map;
}

/** Nhãn POS tiếng Hàn → nhãn ngắn dùng chung. */
const KO_POS: Record<string, string> = {
  명사: "noun",
  동사: "verb",
  형용사: "adjective",
  부사: "adverb",
  대명사: "pronoun",
  관형사: "determiner",
  감탄사: "interjection",
};

// Cấu trúc LMF của krdict (bản tải JSON đầy đủ) rất linh hoạt: `feat` có thể là
// object hoặc mảng; nhiều phần tử có thể là object hoặc mảng object.
type LmfNode = Record<string, unknown>;
const asArray = (x: unknown): LmfNode[] =>
  Array.isArray(x) ? (x as LmfNode[]) : x ? [x as LmfNode] : [];
const feats = (node: unknown): LmfNode[] =>
  node && typeof node === "object" ? asArray((node as LmfNode).feat) : [];
const featVal = (node: unknown, att: string): string | undefined => {
  for (const f of feats(node)) if (f.att === att) return f.val as string;
  return undefined;
};

/**
 * Phân tích Korean Basic Dictionary (krdict) định dạng LMF JSON (§7.1). Trả về
 * Map writtenForm → RawEntry: cách đọc (phát âm), POS, nghĩa tiếng Anh
 * (Equivalent 영어), gốc Hán (origin), và id entry. Pure function.
 */
export function parseKrdictLmf(
  lexicalEntries: unknown[],
): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  for (const entryRaw of lexicalEntries) {
    const entry = entryRaw as LmfNode;
    const lemmaNode = asArray(entry.Lemma)[0];
    const term = featVal(lemmaNode, "writtenForm");
    if (!term || map.has(term)) continue;

    const pos = featVal(entry, "partOfSpeech");
    // Phát âm: WordForm có type=발음.
    let reading: string | undefined;
    for (const wf of asArray(entry.WordForm)) {
      if (featVal(wf, "type") === "발음") {
        reading = featVal(wf, "pronunciation");
        break;
      }
    }
    // Nghĩa tiếng Anh: Equivalent có language=영어 ở Sense đầu.
    const sense = asArray(entry.Sense)[0];
    let glossEn: string | undefined;
    for (const eq of asArray(sense?.Equivalent)) {
      if (featVal(eq, "language") === "영어") {
        glossEn = featVal(eq, "lemma") ?? featVal(eq, "definition");
        break;
      }
    }
    map.set(term, {
      term,
      reading,
      partOfSpeech: pos ? (KO_POS[pos] ?? pos) : undefined,
      glossEn,
      entryId: entry.val as string, // att=id → val=<mã>
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Từ điển song ngữ Việt lớn (CVDICT, StarDict Anh–Việt, Nhật–Việt).
// ---------------------------------------------------------------------------

export interface DictCandidate {
  term: string;
  meaningVi: string;
  reading?: string;
  romanization?: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
  exampleVi?: string;
}

export interface DictBuildOptions {
  language: LanguageCode;
  sourceId: string;
  idPrefix: string;
  baseLevel: string; // vd "Từ điển Anh–Việt"
  advancedLevel: string; // vd "Nâng cao (Anh–Việt)"
  baseCount: number; // số từ "cơ bản" (ngắn nhất) trước khi sang nâng cao
  cap: number; // tổng trần để app không quá nặng
  topic: string;
}

const VI_LETTERS =
  /[a-zàáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;

/**
 * Làm sạch nghĩa Việt từ định dạng từ điển (StarDict Anh–Việt/Nhật–Việt,
 * CVDICT): bỏ HTML, bỏ dòng cách đọc `{kana}`/`@kana`, bỏ câu ví dụ (`=...`),
 * lấy dòng đầu tiên thực sự là nghĩa. Trả chuỗi rỗng nếu không có nghĩa.
 */
export function cleanViMeaning(raw: string): string {
  const lines = raw
    .replace(/<[^>]+>/g, " ")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let line of lines) {
    if (line.startsWith("=")) continue; // câu ví dụ
    line = line.replace(/^[-•*]\s*/, ""); // gạch đầu dòng
    line = line.replace(/^@\S+\s*/, ""); // @kana
    line = line.replace(/^\{[^}]*\}\s*[,，]?\s*/, ""); // {kana}/{english} đầu
    line = line.replace(/\s+/g, " ").trim();
    if (/^\/.*\/$/.test(line)) continue; // dòng phiên âm IPA /.../
    if (line && VI_LETTERS.test(line)) return line.slice(0, 200);
  }
  // Không có dòng nào là nghĩa tiếng Việt → bỏ (importer sẽ loại mục này).
  return "";
}

/** Trích cách đọc kana (từ `{kana}` hoặc `@kana`) trong định nghĩa Nhật–Việt. */
export function extractKanaReading(raw: string): string | undefined {
  const m =
    raw.match(/\{([぀-ヿー]+)\}/) ||
    raw.match(/@\s*([぀-ヿー]+)/) ||
    raw.match(/^-\s*([぀-ヿー]+)\s*$/m);
  return m ? m[1] : undefined;
}

/**
 * Dựng dataset từ điển song ngữ, chia tầng theo độ dài từ: những từ ngắn nhất
 * (thường thông dụng hơn) vào `baseLevel`, phần còn lại vào `advancedLevel`,
 * cắt ở `cap` để giữ hiệu năng. Nghĩa Việt là thật (từ từ điển) nhưng vẫn
 * reviewStatus=draft cho tới khi rà soát.
 */
export function buildDictionaryDataset(
  candidates: DictCandidate[],
  opts: DictBuildOptions,
): VocabularyDataset {
  const seen = new Set<string>();
  const uniq = candidates.filter((c) => {
    if (!c.term || !c.meaningVi || seen.has(c.term)) return false;
    seen.add(c.term);
    return true;
  });
  // Sắp theo độ dài rồi bảng chữ để chọn từ ngắn/thông dụng trước.
  uniq.sort(
    (a, b) => a.term.length - b.term.length || a.term.localeCompare(b.term),
  );
  const chosen = uniq.slice(0, opts.cap);

  const items: VocabularyItem[] = chosen.map((c, i) => ({
    id: `${opts.idPrefix}${String(i + 1).padStart(5, "0")}`,
    language: opts.language,
    term: c.term,
    reading: c.reading,
    romanization: c.romanization,
    ipa: c.ipa,
    partOfSpeech: c.partOfSpeech,
    meaningVi: c.meaningVi,
    example: c.example ?? "",
    exampleVi: c.exampleVi ?? "",
    level: i < opts.baseCount ? opts.baseLevel : opts.advancedLevel,
    topic: opts.topic,
    tags: [],
    isInterviewVocabulary: false,
    sourceIds: [opts.sourceId],
    definitionSourceLanguage: "vi",
    reviewStatus: "draft",
  }));

  return {
    language: opts.language,
    level: opts.baseLevel,
    sources: [],
    items,
  };
}

// ---------------------------------------------------------------------------
// Bộ dựng dataset draft từ seed + bản ghi thô của nguồn.
// ---------------------------------------------------------------------------

export interface BuildOptions {
  language: LanguageCode;
  level: string;
  topic?: string;
  syllabusVersion?: string;
  sourceId: string; // id nguồn từ điển (vd "cc-cedict")
  /** Hàm dựng URL entry cụ thể từ RawEntry (không chỉ trang chủ). */
  entryUrl?: (raw: RawEntry) => string | undefined;
  idPrefix: string; // vd "zh-cedict-"
}

export interface BuildResult {
  dataset: VocabularyDataset;
  matched: string[];
  missing: string[]; // seed không tra được trong nguồn
}

/**
 * Ghép seed (nghĩa Việt do dự án viết) với dữ liệu gốc từ nguồn để tạo item
 * `draft`. Seed không tìm thấy trong nguồn được liệt kê ở `missing` để đưa vào
 * hàng đợi rà soát thay vì đoán bừa.
 */
export function buildDatasetFromSeeds(
  seeds: VocabularySeed[],
  raw: Map<string, RawEntry>,
  opts: BuildOptions,
): BuildResult {
  const items: VocabularyItem[] = [];
  const matched: string[] = [];
  const missing: string[] = [];

  seeds.forEach((seed, i) => {
    const entry = raw.get(seed.term);
    if (!entry) {
      missing.push(seed.term);
      return;
    }
    matched.push(seed.term);
    const id = `${opts.idPrefix}${String(i + 1).padStart(4, "0")}`;
    const item: VocabularyItem = {
      id,
      language: opts.language,
      term: seed.term,
      reading: seed.reading ?? entry.reading,
      romanization: entry.romanization,
      ipa: entry.ipa,
      partOfSpeech: seed.partOfSpeech ?? entry.partOfSpeech,
      meaningVi: seed.meaningVi,
      explanationVi: entry.glossEn
        ? `Định nghĩa nguồn (EN): ${entry.glossEn}`
        : undefined,
      example: seed.example,
      exampleVi: seed.exampleVi,
      level: seed.level,
      syllabusVersion: opts.syllabusVersion,
      topic: seed.topic,
      tags: seed.tags ?? [],
      isInterviewVocabulary: false,
      sourceIds: [opts.sourceId],
      sourceEntryId: entry.entryId,
      sourceEntryUrl: opts.entryUrl?.(entry),
      definitionSourceLanguage: "en",
      exampleSelfAuthored: true,
      reviewStatus: "draft",
    };
    items.push(item);
  });

  const dataset: VocabularyDataset = {
    language: opts.language,
    level: opts.level,
    topic: opts.topic,
    syllabusVersion: opts.syllabusVersion,
    sources: [],
    items,
  };
  return { dataset, matched, missing };
}
