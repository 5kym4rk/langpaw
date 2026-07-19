/**
 * Importer JMdict (§8.1). CC BY-SA 4.0 (EDRDG).
 * Tải & giải nén JMdict_e (XML) từ:
 *   https://www.edrdg.org/jmdict/j_jmdict.html
 * Chạy:
 *   npm run import:ja -- /đường/dẫn/JMdict_e
 * Lưu ý: không nhập proper names; nghĩa Việt do dự án biên soạn (draft).
 */
import {
  parseJmdict,
  buildDatasetFromSeeds,
} from "../src/services/data/import/parsers.ts";
import { readSeeds, requireSourceFile, writeDataset } from "./import-common.ts";

const xml = requireSourceFile(
  2,
  "Tải JMdict_e (XML) từ edrdg.org rồi giải nén.",
);
const seeds = readSeeds("ja");
const raw = parseJmdict(xml);

const result = buildDatasetFromSeeds(seeds, raw, {
  language: "ja",
  level: "JF-reference",
  syllabusVersion: "JF-Standard-reference",
  sourceId: "jmdict",
  idPrefix: "ja-jmdict-",
  entryUrl: (e) =>
    e.entryId
      ? `https://www.edrdg.org/jmdictdb/cgi-bin/entr.py?svc=jmdict&q=${e.entryId}`
      : undefined,
});

writeDataset(result, {
  sourceId: "jmdict",
  outFile: "src/data/ja/generated/jmdict.json",
  language: "ja",
});
