import type { VocabularyItem } from "@/types";
import { shuffle } from "@/services/data/vocabulary-filters";

/**
 * Chọn đáp án nhiễu cho một từ, ưu tiên (§14.1):
 * 1. Cùng ngôn ngữ (đã đảm bảo bởi pool truyền vào).
 * 2. Cùng loại từ.
 * 3. Cùng cấp độ.
 * 4. Cùng chủ đề / trường nghĩa.
 * 5. Không trùng nghĩa rõ ràng với đáp án đúng.
 *
 * Nếu không đủ, giảm dần điều kiện nhưng không tạo đáp án vô nghĩa
 * (chỉ lấy trong pool thật). Trả về tối đa `count` mục.
 */
export function pickDistractors(
  correct: VocabularyItem,
  pool: VocabularyItem[],
  count: number,
  random: () => number = Math.random,
): VocabularyItem[] {
  const candidates = pool.filter(
    (item) => item.id !== correct.id && item.meaningVi !== correct.meaningVi,
  );

  const score = (item: VocabularyItem): number => {
    let s = 0;
    if (item.partOfSpeech && item.partOfSpeech === correct.partOfSpeech) s += 4;
    if (item.level === correct.level) s += 2;
    if (item.topic === correct.topic) s += 1;
    return s;
  };

  // Xáo trộn trước để các mục cùng điểm không luôn theo một thứ tự cố định,
  // rồi sắp theo điểm giảm dần (sort ổn định giữ thứ tự đã xáo).
  const shuffled = shuffle(candidates, random);
  shuffled.sort((a, b) => score(b) - score(a));

  return shuffled.slice(0, count);
}

/**
 * Tạo danh sách lựa chọn (đáp án đúng + nhiễu) đã xáo trộn, không trùng.
 */
export function buildChoices(
  correct: VocabularyItem,
  pool: VocabularyItem[],
  count: number,
  random: () => number = Math.random,
): VocabularyItem[] {
  const distractors = pickDistractors(correct, pool, count - 1, random);
  return shuffle([correct, ...distractors], random);
}
