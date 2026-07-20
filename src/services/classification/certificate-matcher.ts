/**
 * Match có ngữ nghĩa giữa từ điển và certificate index (spec P0-III).
 * Exact-match mặt chữ CHƯA đủ: phải kiểm thêm POS (en), pinyin/sense (zh),
 * reading (ja), homonym/entryId (ko). Pure module — mọi hàm test được.
 */

// ---------------------------------------------------------------------------
// Chuẩn hóa pinyin: "wàn" / "wan4" / "wan 4" / "WAN4" → "wan4"
// ---------------------------------------------------------------------------

const PINYIN_MARKS: Record<string, [string, number]> = {
  ā: ["a", 1],
  á: ["a", 2],
  ǎ: ["a", 3],
  à: ["a", 4],
  ē: ["e", 1],
  é: ["e", 2],
  ě: ["e", 3],
  è: ["e", 4],
  ī: ["i", 1],
  í: ["i", 2],
  ǐ: ["i", 3],
  ì: ["i", 4],
  ō: ["o", 1],
  ó: ["o", 2],
  ǒ: ["o", 3],
  ò: ["o", 4],
  ū: ["u", 1],
  ú: ["u", 2],
  ǔ: ["u", 3],
  ù: ["u", 4],
  ǖ: ["ü", 1],
  ǘ: ["ü", 2],
  ǚ: ["ü", 3],
  ǜ: ["ü", 4],
  ń: ["n", 2],
  ň: ["n", 3],
  ǹ: ["n", 4],
  ḿ: ["m", 2],
};

/** Một âm tiết có dấu → chữ thường + số thanh cuối. */
function syllableToNumbered(syl: string): string {
  let tone = 0;
  let base = "";
  for (const ch of syl) {
    const hit = PINYIN_MARKS[ch];
    if (hit) {
      base += hit[0];
      tone = hit[1];
    } else {
      base += ch;
    }
  }
  // Đã có số thanh sẵn (wan4) → giữ; "wan" không thanh → không thêm.
  const m = base.match(/^([a-zü]+)([1-5])?$/);
  if (!m) return base;
  const num = m[2] ? Number(m[2]) : tone;
  return m[1] + (num ? String(num) : "");
}

/** Chuẩn hóa chuỗi pinyin bất kỳ về dạng "wan4jin1" (thường, liền, số thanh). */
export function normalizePinyin(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/u:/g, "ü")
    .replace(/['’·-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((chunk) =>
      // "wan4" liền số hoặc có dấu; tách cụm dính số: "dian4ya1"
      chunk.split(/(?<=[1-5])/),
    )
    .map(syllableToNumbered)
    .join("");
}

/** So khớp pinyin không phân biệt thanh điệu (dự phòng khi nguồn thiếu thanh). */
export function pinyinBase(raw: string): string {
  return normalizePinyin(raw).replace(/[1-5]/g, "");
}

// ---------------------------------------------------------------------------
// Chuẩn hóa kana: katakana → hiragana, full/half-width, giữ ký hiệu kéo dài.
// ---------------------------------------------------------------------------

export function normalizeKana(raw: string): string {
  const nfkc = raw.normalize("NFKC"); // half-width katakana → full-width
  let out = "";
  for (const ch of nfkc) {
    const code = ch.codePointAt(0)!;
    // Katakana (30A1–30F6) → Hiragana (chênh 0x60). Giữ ー và ký hiệu khác.
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out.trim();
}

// ---------------------------------------------------------------------------
// Chuẩn hóa POS tiếng Anh.
// ---------------------------------------------------------------------------

export type NormalizedPos =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "pronoun"
  | "determiner"
  | "interjection"
  | "auxiliary"
  | "modal"
  | "phrasal-verb"
  | "";

const POS_MAP: Record<string, NormalizedPos> = {
  n: "noun",
  "n.": "noun",
  noun: "noun",
  "danh từ": "noun",
  v: "verb",
  "v.": "verb",
  verb: "verb",
  "động từ": "verb",
  "ngoại động từ": "verb",
  "nội động từ": "verb",
  "trợ động từ": "auxiliary",
  adj: "adjective",
  "adj.": "adjective",
  adjective: "adjective",
  "tính từ": "adjective",
  adv: "adverb",
  "adv.": "adverb",
  adverb: "adverb",
  "phó từ": "adverb",
  prep: "preposition",
  "prep.": "preposition",
  preposition: "preposition",
  "giới từ": "preposition",
  conj: "conjunction",
  "conj.": "conjunction",
  conjunction: "conjunction",
  "liên từ": "conjunction",
  pron: "pronoun",
  "pron.": "pronoun",
  pronoun: "pronoun",
  "đại từ": "pronoun",
  det: "determiner",
  "det.": "determiner",
  determiner: "determiner",
  "mạo từ": "determiner",
  article: "determiner",
  interj: "interjection",
  interjection: "interjection",
  "thán từ": "interjection",
  exclamation: "interjection",
  auxiliary: "auxiliary",
  "auxiliary verb": "auxiliary",
  modal: "modal",
  "modal verb": "modal",
  "modal auxiliary": "modal",
  "phrasal verb": "phrasal-verb",
  "phrasal-verb": "phrasal-verb",
};

export function normalizeEnPos(raw?: string): NormalizedPos {
  if (!raw) return "";
  const key = raw.toLowerCase().trim();
  return POS_MAP[key] ?? POS_MAP[key.replace(/\.$/, "")] ?? "";
}

// ---------------------------------------------------------------------------
// Lọc nghĩa lỗi (invalidMeaning) — spec III.1.
// ---------------------------------------------------------------------------

const POS_ONLY = new Set([
  "danh từ",
  "động từ",
  "tính từ",
  "phó từ",
  "liên từ",
  "giới từ",
  "đại từ",
  "thán từ",
  "trạng từ",
  "mạo từ",
  "viết tắt",
  "noun",
  "verb",
  "adjective",
  "adverb",
  "receiver",
  "conjunction",
  "preposition",
  "pronoun",
  "interjection",
]);

/** Nghĩa Việt không đủ chất lượng làm flashcard? */
export function isInvalidMeaningVi(meaningVi: string): boolean {
  const clean = meaningVi
    .replace(/^[@#*\-–—•\s]+/, "")
    .replace(/[()[\]{}.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (clean.length < 2) return true;
  if (POS_ONLY.has(clean)) return true;
  // Chuỗi kiểu "@ab vt của ..." còn sót markup / chỉ tham chiếu viết tắt.
  if (/^(vt của|viết tắt của|xem\b)/.test(clean)) return true;
  // Không còn ký tự chữ nào (chỉ số/ký hiệu).
  if (!/[a-zà-ỹ぀-ヿ一-鿿가-힣]/i.test(clean)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Nhận diện sense hiếm/tên riêng tiếng Trung (senseMismatch) — spec III.2.
// ---------------------------------------------------------------------------

const ZH_RARE_SENSE =
  /(họ người|họ [A-ZÀ-Ỹ]|dùng trong họ|tên riêng|tên người|biến thể cổ|dạng cổ|chữ cổ|ký tự cổ|âm đọc hiếm|ít dùng|thành tố)/i;

export function isRareZhSense(meaningVi: string): boolean {
  return ZH_RARE_SENSE.test(meaningVi);
}

// ---------------------------------------------------------------------------
// Kết quả match chung.
// ---------------------------------------------------------------------------

export interface MatchOutcome {
  level: string;
  matchType: "lemma-pos" | "exact-term" | "term-reading" | "manual";
  confidence: number;
  requiresReview: boolean;
  senseMismatch?: boolean;
}

// ---- Tiếng Anh: lemma + POS ----
export interface EnIndexEntry {
  lemma: string;
  pos: string;
  level: string;
}

export function matchEnglish(
  _term: string,
  itemPos: string | undefined,
  candidates: EnIndexEntry[] | undefined,
  levelRank: Map<string, number>,
): MatchOutcome | null {
  if (!candidates?.length) return null;
  const pos = normalizeEnPos(itemPos);
  if (pos) {
    const hit = candidates.find((c) => normalizeEnPos(c.pos) === pos);
    if (hit) {
      return {
        level: hit.level,
        matchType: "lemma-pos",
        confidence: 1,
        requiresReview: false,
      };
    }
  }
  const levels = [...new Set(candidates.map((c) => c.level))];
  const posSet = [...new Set(candidates.map((c) => normalizeEnPos(c.pos)))];
  // lemma-only chỉ khi duy nhất một cấp VÀ một POS trong index (spec III.1.3).
  if (levels.length === 1 && posSet.length === 1) {
    return {
      level: levels[0],
      matchType: "exact-term",
      confidence: 0.85,
      requiresReview: false,
    };
  }
  // Nhiều POS/cấp mà không xác minh được POS của item → cần rà soát.
  const lowest = levels.sort(
    (a, b) => (levelRank.get(a) ?? 99) - (levelRank.get(b) ?? 99),
  )[0];
  return {
    level: lowest,
    matchType: "exact-term",
    confidence: 0.5,
    requiresReview: true,
  };
}

// ---- Tiếng Trung: simplified + pinyin + sense ----
export interface ZhIndexEntry {
  simplified: string;
  traditional?: string;
  pinyin?: string; // đã chuẩn hóa normalizePinyin
  level: string;
}

export function matchChinese(
  _term: string,
  itemPinyin: string | undefined,
  meaningVi: string,
  candidates: ZhIndexEntry[] | undefined,
): MatchOutcome | null {
  if (!candidates?.length) return null;
  const rare = isRareZhSense(meaningVi);
  const py = itemPinyin ? normalizePinyin(itemPinyin) : "";

  if (py) {
    const exact = candidates.find((c) => c.pinyin && c.pinyin === py);
    if (exact) {
      // Trùng cả chữ lẫn pinyin nhưng nghĩa là sense hiếm (họ/cổ) → mismatch
      // với sense phổ thông của HSK: cần người rà soát.
      return {
        level: exact.level,
        matchType: "term-reading",
        confidence: rare ? 0.5 : 1,
        requiresReview: rare,
        senseMismatch: rare,
      };
    }
    const baseHit = candidates.find(
      (c) => c.pinyin && pinyinBase(c.pinyin) === pinyinBase(py),
    );
    if (baseHit) {
      // Chỉ khác thanh điệu (nguồn có thể ghi khác) → chấp nhận kèm rà soát nhẹ.
      return {
        level: baseHit.level,
        matchType: "term-reading",
        confidence: 0.8,
        requiresReview: rare,
        senseMismatch: rare,
      };
    }
    // Cùng chữ nhưng pinyin KHÁC (万 mò vs wàn) → sense mismatch, không gán cấp.
    return {
      level: candidates[0].level,
      matchType: "exact-term",
      confidence: 0.3,
      requiresReview: true,
      senseMismatch: true,
    };
  }
  // Không có pinyin phía từ điển: term-only chỉ khi index một mục duy nhất.
  if (candidates.length === 1 && !rare) {
    return {
      level: candidates[0].level,
      matchType: "exact-term",
      confidence: 0.7,
      requiresReview: true, // thiếu cách đọc để xác minh → vẫn cần rà soát
    };
  }
  return {
    level: candidates[0].level,
    matchType: "exact-term",
    confidence: 0.3,
    requiresReview: true,
    senseMismatch: rare || undefined,
  };
}

// ---- Tiếng Nhật: expression + normalized reading ----
export interface JaIndexEntry {
  expression: string;
  reading: string;
  level: string;
}

const HAS_KANJI = /[一-鿿]/;

export function matchJapanese(
  term: string,
  itemReading: string | undefined,
  candidates: JaIndexEntry[] | undefined,
): MatchOutcome | null {
  if (!candidates?.length) return null;
  const reading = itemReading ? normalizeKana(itemReading) : "";
  if (reading) {
    const hit = candidates.find((c) => normalizeKana(c.reading) === reading);
    if (hit) {
      return {
        level: hit.level,
        matchType: "term-reading",
        confidence: 1,
        requiresReview: false,
      };
    }
  }
  const readings = [
    ...new Set(candidates.map((c) => normalizeKana(c.reading))),
  ];
  const levels = [...new Set(candidates.map((c) => c.level))];
  // expression-only chỉ khi duy nhất một reading và một level (spec III.3.3).
  if (readings.length === 1 && levels.length === 1) {
    const kanji = HAS_KANJI.test(term);
    return {
      level: levels[0],
      matchType: "exact-term",
      confidence: reading ? 0.6 : kanji ? 0.6 : 0.8,
      // Có kanji mà reading không khớp/thiếu → cần rà soát.
      requiresReview: kanji ? true : Boolean(reading),
    };
  }
  // Nhiều reading/level → review queue, không tự gán chắc chắn.
  return {
    level: levels[0],
    matchType: "exact-term",
    confidence: 0.3,
    requiresReview: true,
  };
}

// ---- Tiếng Hàn: term + entryId (target_code), homonym cần POS/entry ----
export interface KoIndexEntry {
  term: string;
  level: string;
  pos?: string;
  entryId?: string;
}

export function matchKorean(
  _term: string,
  itemEntryId: string | undefined,
  itemPos: string | undefined,
  candidates: KoIndexEntry[] | undefined,
): MatchOutcome | null {
  if (!candidates?.length) return null;
  // Ưu tiên tuyệt đối: entryId (target_code) trùng.
  if (itemEntryId) {
    const hit = candidates.find((c) => c.entryId === itemEntryId);
    if (hit) {
      return {
        level: hit.level,
        matchType: "exact-term",
        confidence: 1,
        requiresReview: false,
      };
    }
  }
  if (candidates.length === 1) {
    return {
      level: candidates[0].level,
      matchType: "exact-term",
      confidence: 0.85,
      requiresReview: false,
    };
  }
  // Homonym nhiều entry: thử POS; không khớp → requiresReview, KHÔNG tự lấy
  // cấp thấp nhất (spec III.4).
  if (itemPos) {
    const posHits = candidates.filter((c) => c.pos === itemPos);
    if (posHits.length === 1) {
      return {
        level: posHits[0].level,
        matchType: "lemma-pos",
        confidence: 0.9,
        requiresReview: false,
      };
    }
  }
  const levels = [...new Set(candidates.map((c) => c.level))];
  // Mọi homonym cùng một cấp → cấp là chắc chắn dù chưa phân biệt sense.
  return {
    level: levels[0],
    matchType: "exact-term",
    confidence: levels.length === 1 ? 0.8 : 0.4,
    requiresReview: levels.length > 1,
  };
}
