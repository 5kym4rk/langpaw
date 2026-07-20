/**
 * Đọc từ điển định dạng StarDict (.idx + .dict, sametypesequence=m).
 * .idx: lặp [word\0][offset uint32 BE][size uint32 BE].
 * .dict: định nghĩa UTF-8 tại [offset, offset+size].
 */
import { readFileSync } from "node:fs";

export interface StarDictEntry {
  word: string;
  definition: string;
}

export function readStarDict(
  idxPath: string,
  dictPath: string,
): StarDictEntry[] {
  const idx = readFileSync(idxPath);
  const dict = readFileSync(dictPath);
  const out: StarDictEntry[] = [];
  let i = 0;
  while (i < idx.length) {
    let z = i;
    while (z < idx.length && idx[z] !== 0) z += 1;
    const word = idx.toString("utf8", i, z);
    const offset = idx.readUInt32BE(z + 1);
    const size = idx.readUInt32BE(z + 5);
    i = z + 9;
    if (offset + size > dict.length) continue;
    out.push({
      word,
      definition: dict.toString("utf8", offset, offset + size),
    });
  }
  return out;
}
