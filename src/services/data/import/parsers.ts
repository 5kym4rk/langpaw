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
