import { describe, it, expect } from "vitest";
import {
  pinyinNumbersToMarks,
  parseCcCedict,
  parseWordNetJson,
  parseWordNet2025,
  parseJmdict,
  parseKrdict,
  parseKrdictLmf,
  buildDatasetFromSeeds,
  cleanViMeaning,
  extractKanaReading,
  buildDictionaryDataset,
  type VocabularySeed,
  type DictCandidate,
} from "./parsers";

describe("pinyinNumbersToMarks", () => {
  it("đặt dấu thanh đúng vị trí", () => {
    expect(pinyinNumbersToMarks("dian4 ya1")).toBe("diànyā");
    expect(pinyinNumbersToMarks("ni3 hao3")).toBe("nǐhǎo");
    expect(pinyinNumbersToMarks("lu:4")).toBe("lǜ");
  });
});

describe("parseCcCedict", () => {
  const sample = [
    "# CC-CEDICT",
    "電壓 电压 [dian4 ya1] /voltage/",
    "電流 电流 [dian4 liu2] /electric current/current/",
    "malformed line without brackets",
  ].join("\n");

  it("rút giản thể, pinyin có dấu, gloss và entry id", () => {
    const map = parseCcCedict(sample);
    expect(map.size).toBe(2);
    const v = map.get("电压");
    expect(v?.reading).toBe("diànyā");
    expect(v?.romanization).toBe("dian4 ya1");
    expect(v?.glossEn).toContain("voltage");
    expect(v?.entryId).toBe("電壓|电压");
  });
});

describe("parseWordNetJson", () => {
  it("lấy lemma, pos, definition từ synset", () => {
    const json = {
      synsets: [
        {
          id: "oewn-00001",
          partOfSpeech: "n",
          definition: "a greeting",
          members: ["hello", "hi"],
        },
      ],
    };
    const map = parseWordNetJson(json);
    expect(map.get("hello")?.partOfSpeech).toBe("noun");
    expect(map.get("hello")?.entryId).toBe("oewn-00001");
    expect(map.get("hi")?.glossEn).toBe("a greeting");
  });
});

describe("parseJmdict", () => {
  const xml = `
    <entry><ent_seq>1000001</ent_seq>
      <k_ele><keb>電圧</keb></k_ele>
      <r_ele><reb>でんあつ</reb></r_ele>
      <sense><pos>&n;</pos><gloss>voltage</gloss></sense>
    </entry>
    <entry><ent_seq>2000002</ent_seq>
      <r_ele><reb>なまえ</reb></r_ele>
    </entry>`;

  it("rút kanji, kana, pos, gloss, ent_seq; bỏ entry thiếu gloss", () => {
    const map = parseJmdict(xml);
    expect(map.get("電圧")?.reading).toBe("でんあつ");
    expect(map.get("電圧")?.entryId).toBe("1000001");
    expect(map.get("電圧")?.glossEn).toBe("voltage");
    // Tra được bằng kana.
    expect(map.get("でんあつ")?.term).toBe("電圧");
    // Entry thiếu gloss bị bỏ.
    expect(map.has("なまえ")).toBe(false);
  });
});

describe("parseWordNet2025", () => {
  it("gộp entries + synset, lấy pos/ipa/definition/synset id", () => {
    const entries = {
      voltage: {
        n: {
          pronunciation: [{ value: "voʊltɪdʒ" }],
          sense: [{ id: "s1", synset: "11543971-n" }],
        },
      },
    };
    const synsets = {
      "11543971-n": {
        definition: ["the rate at which energy is drawn"],
        partOfSpeech: "n",
        members: ["voltage"],
      },
    };
    const map = parseWordNet2025(entries, synsets);
    const v = map.get("voltage");
    expect(v?.partOfSpeech).toBe("noun");
    expect(v?.ipa).toBe("voʊltɪdʒ");
    expect(v?.glossEn).toContain("energy");
    expect(v?.entryId).toBe("11543971-n");
  });
});

describe("parseKrdictLmf", () => {
  it("rút writtenForm, phát âm, pos, nghĩa Anh, id từ LMF", () => {
    const entries = [
      {
        att: "id",
        val: "74720",
        feat: [{ att: "partOfSpeech", val: "명사" }],
        Lemma: { feat: { att: "writtenForm", val: "전압" } },
        WordForm: [
          {
            feat: [
              { att: "type", val: "발음" },
              { att: "pronunciation", val: "저ː납" },
            ],
          },
        ],
        Sense: {
          Equivalent: [
            {
              feat: [
                { att: "language", val: "영어" },
                { att: "lemma", val: "voltage" },
              ],
            },
          ],
        },
      },
    ];
    const map = parseKrdictLmf(entries);
    const v = map.get("전압");
    expect(v?.reading).toBe("저ː납");
    expect(v?.partOfSpeech).toBe("noun");
    expect(v?.glossEn).toBe("voltage");
    expect(v?.entryId).toBe("74720");
  });
});

describe("parseKrdict", () => {
  it("chuẩn hóa item API thành RawEntry", () => {
    const map = parseKrdict([
      {
        word: "전압",
        pronunciation: "저납",
        romanization: "jeonap",
        pos: "명사",
        senseEn: "voltage",
        targetCode: "12345",
      },
    ]);
    expect(map.get("전압")?.glossEn).toBe("voltage");
    expect(map.get("전압")?.entryId).toBe("12345");
  });
});

describe("cleanViMeaning", () => {
  it("bỏ dòng cách đọc/IPA, lấy nghĩa Việt", () => {
    expect(cleanViMeaning("- {にっぽん}\n- Nhật Bản")).toBe("Nhật Bản");
    expect(cleanViMeaning("@あい\n- tình yêu, lòng thương mến.")).toBe(
      "tình yêu, lòng thương mến.",
    );
    expect(cleanViMeaning("- /æd/\n- quảng cáo")).toBe("quảng cáo");
    expect(cleanViMeaning("- {うし}")).toBe(""); // không có nghĩa Việt
  });
});

describe("extractKanaReading", () => {
  it("lấy kana trong {..} hoặc sau @", () => {
    expect(extractKanaReading("- {みず}\n- nước")).toBe("みず");
    expect(extractKanaReading("@あい\n- tình yêu")).toBe("あい");
  });
});

describe("buildDictionaryDataset", () => {
  it("chia tầng theo độ dài và cắt ở cap", () => {
    const cands: DictCandidate[] = [
      { term: "aaa", meaningVi: "ba a" },
      { term: "a", meaningVi: "một a" },
      { term: "aa", meaningVi: "hai a" },
      { term: "aaaa", meaningVi: "bốn a" },
    ];
    const ds = buildDictionaryDataset(cands, {
      language: "en",
      sourceId: "envi-stardict",
      idPrefix: "en-vi-",
      baseLevel: "Từ điển Anh–Việt",
      advancedLevel: "Nâng cao (Anh–Việt)",
      baseCount: 2,
      cap: 3,
      topic: "Từ điển",
    });
    expect(ds.items).toHaveLength(3); // cắt ở cap
    expect(ds.items[0].term).toBe("a"); // ngắn nhất trước
    expect(ds.items[0].level).toBe("Từ điển Anh–Việt");
    expect(ds.items[2].level).toBe("Nâng cao (Anh–Việt)");
    expect(ds.items[0].reviewStatus).toBe("draft");
  });
});

describe("buildDatasetFromSeeds", () => {
  const seeds: VocabularySeed[] = [
    {
      term: "电压",
      meaningVi: "điện áp",
      example: "电压很高。",
      exampleVi: "Điện áp rất cao.",
      level: "HSK4",
      topic: "Điện tử",
    },
    {
      term: "不存在",
      meaningVi: "không tồn tại",
      example: "x",
      exampleVi: "y",
      level: "HSK4",
      topic: "Điện tử",
    },
  ];

  it("ghép seed với nguồn, đánh dấu draft và liệt kê seed thiếu", () => {
    const raw = parseCcCedict("電壓 电压 [dian4 ya1] /voltage/");
    const { dataset, matched, missing } = buildDatasetFromSeeds(seeds, raw, {
      language: "zh",
      level: "HSK4",
      syllabusVersion: "GF0025-2021",
      sourceId: "cc-cedict",
      idPrefix: "zh-cedict-",
      entryUrl: () =>
        "https://www.mdbg.net/chinese/dictionary?wdqb=%E7%94%B5%E5%8E%8B",
    });
    expect(matched).toEqual(["电压"]);
    expect(missing).toEqual(["不存在"]);
    expect(dataset.items).toHaveLength(1);
    const item = dataset.items[0];
    expect(item.reviewStatus).toBe("draft");
    expect(item.exampleSelfAuthored).toBe(true);
    expect(item.definitionSourceLanguage).toBe("en");
    expect(item.sourceEntryId).toBe("電壓|电压");
    expect(item.reading).toBe("diànyā");
    expect(item.sourceEntryUrl).toContain("mdbg.net");
  });
});
