/**
 * Importer CVDICT — Từ điển Hán Việt (§6). CC BY-SA 4.0.
 * https://github.com/ph0ngp/CVDICT (định dạng CC-CEDICT, nghĩa tiếng Việt).
 *   npm run import:zh-vi -- /đường/dẫn/CVDICT.u8
 */
import {
  pinyinNumbersToMarks,
  cleanViMeaning,
  buildDictionaryDataset,
  type DictCandidate,
} from "../src/services/data/import/parsers.ts";
import { requireSourceFile, writeDataset } from "./import-common.ts";

const text = requireSourceFile(2, "Tải CVDICT.u8 từ github.com/ph0ngp/CVDICT.");
const cands: DictCandidate[] = [];
for (const line of text.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]*)\]\s+\/(.*)\/\s*$/);
  if (!m) continue;
  const [, , simplified, pinyinNum, glosses] = m;
  // Chỉ lấy từ là chữ Hán (bỏ ký hiệu %, □, ○, chữ Latinh…).
  if (!/^[一-鿿]+$/.test(simplified)) continue;
  const meaningVi = cleanViMeaning(glosses.split("/").filter(Boolean)[0] ?? "");
  if (!meaningVi) continue;
  cands.push({
    term: simplified,
    meaningVi,
    reading: pinyinNumbersToMarks(pinyinNum),
    romanization: pinyinNum.trim(),
  });
}

const dataset = buildDictionaryDataset(cands, {
  language: "zh",
  sourceId: "cvdict",
  idPrefix: "zh-cvdict-",
  baseLevel: "Từ điển Hán–Việt",
  advancedLevel: "Nâng cao (Hán–Việt)",
  baseCount: 8000,
  cap: 20000,
  topic: "Từ điển",
});

writeDataset(
  { dataset, matched: [], missing: [] },
  {
    sourceId: "cvdict",
    outFile: "src/data/zh/generated/cvdict.json",
    language: "zh",
  },
);
