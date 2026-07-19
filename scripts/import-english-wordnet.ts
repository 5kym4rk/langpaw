/**
 * Importer Open English WordNet (§5.1). CC BY 4.0.
 * Tải: https://en-word.net/static/english-wordnet-2025-json.zip
 * Giải nén ra file .json rồi chạy:
 *   npm run import:en -- /đường/dẫn/english-wordnet-2025.json
 */
import {
  parseWordNetJson,
  buildDatasetFromSeeds,
} from "../src/services/data/import/parsers.ts";
import { readSeeds, requireSourceFile, writeDataset } from "./import-common.ts";

const text = requireSourceFile(
  2,
  "Tải english-wordnet-2025-json.zip từ en-word.net rồi giải nén.",
);
const seeds = readSeeds("en");
const raw = parseWordNetJson(JSON.parse(text));

const result = buildDatasetFromSeeds(seeds, raw, {
  language: "en",
  level: "CEFR-reference",
  syllabusVersion: "CEFR-reference",
  sourceId: "oewn-2025",
  idPrefix: "en-oewn-",
  entryUrl: (e) =>
    e.entryId ? `https://en-word.net/id/${e.entryId}` : undefined,
});

writeDataset(result, {
  sourceId: "oewn-2025",
  outFile: "src/data/en/generated/wordnet.json",
  language: "en",
});
