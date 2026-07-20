import { describe, it, expect } from "vitest";
import {
  normalizePinyin,
  normalizeKana,
  normalizeEnPos,
  isInvalidMeaningVi,
  matchEnglish,
  matchChinese,
  matchJapanese,
  matchKorean,
} from "./certificate-matcher";

const enRank = new Map(
  ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"].map((l, i) => [l, i]),
);

describe("normalizePinyin", () => {
  it("wàn / wan4 / wan 4 / WAN4 so sánh được với nhau", () => {
    expect(normalizePinyin("wàn")).toBe("wan4");
    expect(normalizePinyin("wan4")).toBe("wan4");
    expect(normalizePinyin("wan 4")).toBe("wan4");
    expect(normalizePinyin("WAN4")).toBe("wan4");
    expect(normalizePinyin("diàn yā")).toBe("dian4ya1");
    expect(normalizePinyin("dian4 ya1")).toBe("dian4ya1");
  });
});

describe("normalizeKana", () => {
  it("katakana → hiragana, full-width hóa", () => {
    expect(normalizeKana("デンアツ")).toBe(normalizeKana("でんあつ"));
    expect(normalizeKana("ﾃﾞﾝｱﾂ")).toBe(normalizeKana("でんあつ"));
    expect(normalizeKana("コーヒー")).toBe("こーひー");
  });
});

describe("normalizeEnPos", () => {
  it("map biến thể về chuẩn", () => {
    expect(normalizeEnPos("n.")).toBe("noun");
    expect(normalizeEnPos("danh từ")).toBe("noun");
    expect(normalizeEnPos("Modal Verb")).toBe("modal");
    expect(normalizeEnPos("phrasal verb")).toBe("phrasal-verb");
  });
});

describe("isInvalidMeaningVi", () => {
  it("nghĩa chỉ là nhãn từ loại → invalid", () => {
    expect(isInvalidMeaningVi("danh từ")).toBe(true);
    expect(isInvalidMeaningVi("(viết tắt)")).toBe(true);
    expect(isInvalidMeaningVi("receiver")).toBe(true);
    expect(isInvalidMeaningVi("vt của able-bodied seaman")).toBe(true);
  });
  it("nghĩa thật → hợp lệ", () => {
    expect(isInvalidMeaningVi("điện áp; hiệu điện thế")).toBe(false);
    expect(isInvalidMeaningVi("đầu, đầu tiên")).toBe(false);
  });
});

describe("matchEnglish (lemma + POS)", () => {
  const abandonIdx = [{ lemma: "abandon", pos: "verb", level: "B1" }];
  const bookIdx = [
    { lemma: "book", pos: "noun", level: "A1" },
    { lemma: "book", pos: "verb", level: "A2" },
  ];

  it("lemma + POS khớp → lemma-pos, không cần review", () => {
    const r = matchEnglish("abandon", "verb", abandonIdx, enRank);
    expect(r).toMatchObject({
      level: "B1",
      matchType: "lemma-pos",
      requiresReview: false,
    });
  });

  it("homograph nhiều POS khác cấp, item không có POS → requiresReview", () => {
    const r = matchEnglish("book", undefined, bookIdx, enRank);
    expect(r?.requiresReview).toBe(true);
  });

  it("lemma-only chỉ chắc chắn khi một cấp + một POS", () => {
    const r = matchEnglish("abandon", undefined, abandonIdx, enRank);
    expect(r?.requiresReview).toBe(false);
    expect(r?.matchType).toBe("exact-term");
  });
});

describe("matchChinese (simplified + pinyin + sense)", () => {
  const wanIdx = [{ simplified: "万", pinyin: "wan4", level: "HSK 1" }];

  it("cùng chữ, đúng pinyin, nghĩa phổ thông → match chắc chắn", () => {
    const r = matchChinese("万", "wàn", "mười nghìn", wanIdx);
    expect(r).toMatchObject({
      level: "HSK 1",
      matchType: "term-reading",
      requiresReview: false,
    });
  });

  it("cùng chữ nhưng KHÁC pinyin (万 mò) → senseMismatch, requiresReview", () => {
    const r = matchChinese("万", "mò", "dùng trong họ 万俟", wanIdx);
    expect(r?.senseMismatch).toBe(true);
    expect(r?.requiresReview).toBe(true);
  });

  it("nghĩa là họ người dù pinyin trùng → không learningReady (review)", () => {
    const r = matchChinese("万", "wàn", "họ Vạn", wanIdx);
    expect(r?.senseMismatch).toBe(true);
    expect(r?.requiresReview).toBe(true);
  });
});

describe("matchJapanese (expression + reading)", () => {
  const kamiIdx = [
    { expression: "紙", reading: "かみ", level: "N4" },
    { expression: "紙", reading: "がみ", level: "N2" },
  ];

  it("reading khớp (kể cả katakana) → term-reading", () => {
    const r = matchJapanese("紙", "カミ", kamiIdx);
    expect(r).toMatchObject({ level: "N4", requiresReview: false });
  });

  it("cùng chữ nhiều reading, item thiếu reading → review", () => {
    const r = matchJapanese("紙", undefined, kamiIdx);
    expect(r?.requiresReview).toBe(true);
  });

  it("kanji thiếu reading dù index một reading → vẫn cần review", () => {
    const r = matchJapanese("水", undefined, [
      { expression: "水", reading: "みず", level: "N5" },
    ]);
    expect(r?.requiresReview).toBe(true);
  });
});

describe("matchKorean (term + entryId, homonym)", () => {
  const nunIdx = [
    { term: "눈", level: "A", pos: "명사", entryId: "100" }, // mắt
    { term: "눈", level: "B", pos: "명사", entryId: "200" }, // tuyết(giả định)
  ];

  it("entryId trùng → chắc chắn tuyệt đối", () => {
    const r = matchKorean("눈", "200", "명사", nunIdx);
    expect(r).toMatchObject({ level: "B", requiresReview: false });
  });

  it("homonym nhiều entry khác cấp, không có entryId → requiresReview, KHÔNG lấy cấp thấp nhất mặc định", () => {
    const r = matchKorean("눈", undefined, undefined, nunIdx);
    expect(r?.requiresReview).toBe(true);
  });

  it("homonym nhưng mọi entry cùng cấp → cấp chắc chắn", () => {
    const same = [
      { term: "배", level: "A", pos: "명사", entryId: "1" },
      { term: "배", level: "A", pos: "명사", entryId: "2" },
    ];
    const r = matchKorean("배", undefined, undefined, same);
    expect(r?.requiresReview).toBe(false);
    expect(r?.level).toBe("A");
  });
});
