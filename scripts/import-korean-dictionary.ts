/**
 * Importer Korean Basic Dictionary — krdict Open API (§7.1).
 * API key lấy tại https://krdict.korean.go.kr/eng/openApi/openApiRegister
 *
 * Cung cấp key qua .env.import.local (KHÔNG commit):
 *   KRDICT_API_KEY=...
 * Chạy:
 *   npm run import:ko
 *
 * Quy tắc (§7.1): không commit key, không để key ở frontend, chỉ dùng trong
 * script; không tải multimedia; lưu entry id + source URL; nghĩa Việt là draft.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  parseKrdict,
  buildDatasetFromSeeds,
  type KrdictItem,
} from "../src/services/data/import/parsers.ts";
import { readSeeds, writeDataset, ROOT } from "./import-common.ts";

function loadApiKey(): string {
  if (process.env.KRDICT_API_KEY) return process.env.KRDICT_API_KEY;
  const envPath = path.join(ROOT, ".env.import.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*KRDICT_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  console.error(
    "\n❌ Thiếu KRDICT_API_KEY. Thêm vào .env.import.local (không commit).\n",
  );
  process.exit(1);
}

const first = (block: string, tag: string): string | undefined => {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : undefined;
};

/** Gọi krdict search cho một từ, trả KrdictItem đầu tiên khớp (nếu có). */
async function lookup(word: string, key: string): Promise<KrdictItem | null> {
  const url =
    `https://krdict.korean.go.kr/api/search?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(word)}&part=word&translated=y&trans_lang=1&num=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const xml = await res.text();
  const item = xml.match(/<item>([\s\S]*?)<\/item>/)?.[1];
  if (!item) return null;
  const senseBlock = item.match(/<sense>([\s\S]*?)<\/sense>/)?.[1] ?? item;
  return {
    word: first(item, "word") ?? word,
    pronunciation: first(item, "pronunciation"),
    pos: first(item, "pos"),
    senseEn: first(senseBlock, "translation")
      ? first(
          item.match(/<translation>([\s\S]*?)<\/translation>/)?.[0] ?? "",
          "trans_word",
        )
      : first(senseBlock, "definition"),
    targetCode: first(item, "target_code"),
  };
}

async function main(): Promise<void> {
  const key = loadApiKey();
  const seeds = readSeeds("ko");
  const items: KrdictItem[] = [];
  for (const seed of seeds) {
    try {
      const it = await lookup(seed.term, key);
      if (it) items.push(it);
    } catch (e) {
      console.warn(`⚠️  Lỗi tra "${seed.term}":`, (e as Error).message);
    }
  }
  const raw = parseKrdict(items);
  const result = buildDatasetFromSeeds(seeds, raw, {
    language: "ko",
    level: "krdict-reference",
    sourceId: "krdict",
    idPrefix: "ko-krdict-",
    entryUrl: (e) =>
      e.entryId
        ? `https://krdict.korean.go.kr/dicSearch/SearchView?ParaWordNo=${e.entryId}`
        : undefined,
  });
  writeDataset(result, {
    sourceId: "krdict",
    outFile: "src/data/ko/generated/krdict.json",
    language: "ko",
  });
}

void main();
