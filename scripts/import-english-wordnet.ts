/**
 * Importer Open English WordNet 2025 (§5.1). CC BY 4.0.
 * Tải: https://en-word.net/static/english-wordnet-2025-json.zip
 * Giải nén ra một thư mục chứa entries-*.json và các file synset noun./verb./
 * adj./adv. rồi chạy:
 *   npm run import:en -- /đường/dẫn/thư-mục-đã-giải-nén
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  parseWordNet2025,
  buildDatasetFromSeeds,
} from "../src/services/data/import/parsers.ts";
import { readSeeds, writeDataset } from "./import-common.ts";

const dir = process.argv[2];
if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) {
  console.error(
    "\n❌ Cần thư mục WordNet 2025 đã giải nén (chứa entries-*.json).\n" +
      "   Tải english-wordnet-2025-json.zip từ en-word.net rồi giải nén.\n",
  );
  process.exit(1);
}

const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const readJson = (f: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(dir, f), "utf8"));

// Gộp toàn bộ entries-*.json và các file synset (noun.*/verb.*/adj.*/adv.*).
const entries: Record<string, unknown> = {};
const synsets: Record<string, unknown> = {};
for (const f of files) {
  if (f.startsWith("entries-")) Object.assign(entries, readJson(f));
  else if (/^(noun|verb|adj|adv)\./.test(f))
    Object.assign(synsets, readJson(f));
}

const raw = parseWordNet2025(
  entries as Parameters<typeof parseWordNet2025>[0],
  synsets as Parameters<typeof parseWordNet2025>[1],
);

const result = buildDatasetFromSeeds(readSeeds("en"), raw, {
  language: "en",
  level: "CEFR-reference",
  syllabusVersion: "CEFR-reference",
  sourceId: "oewn-2025",
  idPrefix: "en-oewn-",
  entryUrl: (e) =>
    e.entryId ? `https://en-word.net/id/oewn-${e.entryId}` : undefined,
});

writeDataset(result, {
  sourceId: "oewn-2025",
  outFile: "src/data/en/generated/wordnet.json",
  language: "en",
});
