/**
 * Bóc nghĩa/POS/cách đọc/ví dụ từ định dạng định nghĩa StarDict (spec P0-III).
 * Pure — test được bằng fixture.
 *
 * en_vi:  "@word /IPA/\n*  danh từ\n- nghĩa\n=ví dụ+ dịch\n..."
 * nhật–việt: "- {かな}\n- nghĩa Việt\n=ví dụ+ dịch"
 */

export interface ParsedEnEntry {
  ipa?: string;
  partOfSpeech?: string; // nhãn gốc tiếng Việt ("danh từ"…)
  meaningVi: string;
  example?: string;
  exampleVi?: string;
}

/** Bóc entry Anh–Việt: IPA, POS đầu tiên, 1–2 dòng nghĩa đầu, ví dụ đầu. */
export function parseEnViDefinition(def: string): ParsedEnEntry | null {
  const lines = def.split(/\r?\n/).map((l) => l.trim());
  let ipa: string | undefined;
  let pos: string | undefined;
  const meanings: string[] = [];
  let example: string | undefined;
  let exampleVi: string | undefined;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("@")) {
      // "@word /IPA/" — chỉ lấy IPA từ dòng đầu; các khối "@Chuyên ngành" dừng.
      const m = line.match(/\/([^/]+)\//);
      if (m && !ipa) ipa = `/${m[1]}/`;
      if (pos && meanings.length) break; // sang khối chuyên ngành → dừng
      continue;
    }
    if (line.startsWith("*")) {
      const label = line.replace(/^\*+\s*/, "").toLowerCase();
      if (!pos) pos = label;
      else if (meanings.length) break; // POS thứ hai → dừng ở sense đầu
      continue;
    }
    if (line.startsWith("-")) {
      if (meanings.length < 2) {
        const meaning = line.replace(/^-+\s*/, "").trim();
        // Bỏ tiền tố chú thích lặp "(nhiếp ảnh) (từ Mỹ,nghĩa Mỹ)".
        if (meaning) meanings.push(meaning);
      }
      continue;
    }
    if (line.startsWith("=") && !example) {
      const body = line.replace(/^=+\s*/, "");
      const [en, vi] = body.split("+").map((s) => s.trim());
      if (en && vi) {
        example = en;
        exampleVi = vi;
      }
      continue;
    }
    if (line.startsWith("!")) break; // idiom — ngoài phạm vi flashcard
  }

  const meaningVi = meanings.join("; ").replace(/\s+/g, " ").trim();
  if (!meaningVi) return null;
  return { ipa, partOfSpeech: pos, meaningVi, example, exampleVi };
}

export interface ParsedJaEntry {
  reading?: string;
  meaningVi: string;
  example?: string;
  exampleVi?: string;
}

const KANA_ONLY = /^[぀-ヿー]+$/;

/** Bóc entry Nhật–Việt: dòng "-{かな}" là cách đọc, dòng "-" thường là nghĩa. */
export function parseJaViDefinition(def: string): ParsedJaEntry | null {
  const lines = def.split(/\r?\n/).map((l) => l.trim());
  let reading: string | undefined;
  const meanings: string[] = [];
  let example: string | undefined;
  let exampleVi: string | undefined;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("-")) {
      const body = line.replace(/^-+\s*/, "").trim();
      const brace = body.match(/^\{(.+)\}$/);
      if (brace) {
        if (!reading && KANA_ONLY.test(brace[1])) reading = brace[1];
        continue; // {english gloss} hoặc {kana} — không phải nghĩa Việt
      }
      // Loại phần {chú thích} lồng trong dòng nghĩa.
      const cleaned = body
        .replace(/\{[^}]*\}/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned && meanings.length < 2) meanings.push(cleaned);
      continue;
    }
    if (line.startsWith("=") && !example) {
      const body = line.replace(/^=+\s*/, "");
      const [ja, vi] = body.split("+").map((s) => s.trim());
      if (ja && vi) {
        example = ja;
        exampleVi = vi;
      }
    }
  }
  const meaningVi = meanings
    .join("; ")
    .replace(/^[,;\s]+|[,;\s]+$/g, "")
    .trim();
  if (!meaningVi) return null;
  return { reading, meaningVi, example, exampleVi };
}
