/**
 * Importer CC-CEDICT (§6.1). CC BY-SA 4.0.
 * Tải file: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
 * Giải nén ra cedict_ts.u8 rồi chạy:
 *   npm run import:zh -- /đường/dẫn/cedict_ts.u8
 */
import {
  parseCcCedict,
  buildDatasetFromSeeds,
} from "../src/services/data/import/parsers.ts";
import { readSeeds, requireSourceFile, writeDataset } from "./import-common.ts";

const text = requireSourceFile(2, "Tải cedict_ts.u8 từ mdbg.net (CC-CEDICT).");
const seeds = readSeeds("zh");
const raw = parseCcCedict(text);

const result = buildDatasetFromSeeds(seeds, raw, {
  language: "zh",
  level: "HSK",
  syllabusVersion: "GF0025-2021",
  sourceId: "cc-cedict",
  idPrefix: "zh-cedict-",
  entryUrl: (e) =>
    `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(e.term)}`,
});

writeDataset(result, {
  sourceId: "cc-cedict",
  outFile: "src/data/zh/generated/cc-cedict.json",
  language: "zh",
});
