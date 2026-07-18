import type { VocabularyItem } from "@/types";
import { shuffle } from "@/services/data/vocabulary-filters";
import { buildChoices } from "./distractors";

export type QuizQuestionType =
  | "meaning-choice" // Nhìn từ → chọn nghĩa tiếng Việt
  | "word-choice" // Nhìn nghĩa → chọn từ
  | "reading-choice" // Nhìn từ → chọn cách đọc
  | "listen-choice" // Nghe từ → chọn nghĩa
  | "fill-blank" // Điền từ vào chỗ trống trong ví dụ
  | "type-word"; // Nhìn nghĩa → nhập từ

export interface QuizChoice {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  item: VocabularyItem;
  /** Nội dung hiển thị của đề bài. */
  prompt: string;
  /** Văn bản cần phát âm (với dạng nghe). */
  audioText?: string;
  /** Lựa chọn cho dạng trắc nghiệm. */
  choices?: QuizChoice[];
  /** id lựa chọn đúng (dạng trắc nghiệm). */
  correctChoiceId?: string;
  /** Đáp án chấp nhận (dạng nhập). */
  acceptedAnswers?: string[];
}

export interface GenerateQuizOptions {
  types?: QuizQuestionType[];
  count: number;
  withAudio?: boolean;
  random?: () => number;
}

const CHOICE_TYPES: QuizQuestionType[] = [
  "meaning-choice",
  "word-choice",
  "reading-choice",
  "listen-choice",
];

function readingOf(item: VocabularyItem): string | undefined {
  return item.reading ?? item.romanization ?? item.ipa;
}

function makeChoiceQuestion(
  item: VocabularyItem,
  pool: VocabularyItem[],
  type: QuizQuestionType,
  random: () => number,
): QuizQuestion | null {
  const options = buildChoices(item, pool, 4, random);
  if (options.length < 2) return null;

  const label = (o: VocabularyItem): string => {
    switch (type) {
      case "word-choice":
        return o.term;
      case "reading-choice":
        return readingOf(o) ?? o.term;
      default:
        return o.meaningVi; // meaning-choice, listen-choice
    }
  };

  // Dạng chọn cách đọc chỉ hợp lệ khi có dữ liệu cách đọc.
  if (type === "reading-choice" && !readingOf(item)) return null;

  const choices: QuizChoice[] = options.map((o) => ({
    id: o.id,
    label: label(o),
  }));

  const prompt =
    type === "word-choice"
      ? item.meaningVi
      : type === "listen-choice"
        ? "Nghe và chọn nghĩa đúng"
        : item.term;

  return {
    id: `${item.id}-${type}`,
    type,
    item,
    prompt,
    audioText: type === "listen-choice" ? item.term : undefined,
    choices,
    correctChoiceId: item.id,
  };
}

function makeInputQuestion(
  item: VocabularyItem,
  type: QuizQuestionType,
): QuizQuestion | null {
  if (type === "fill-blank") {
    if (!item.example.includes(item.term)) return null;
    const blanked = item.example.replace(item.term, "_____");
    return {
      id: `${item.id}-${type}`,
      type,
      item,
      prompt: blanked,
      acceptedAnswers: [item.term, ...(item.alternateForms ?? [])],
    };
  }
  // type-word
  return {
    id: `${item.id}-${type}`,
    type,
    item,
    prompt: item.meaningVi,
    acceptedAnswers: [item.term, ...(item.alternateForms ?? [])],
  };
}

/**
 * Sinh danh sách câu hỏi quiz từ tập từ. Pure function, truyền `random` để test.
 * Bỏ qua câu hỏi không tạo được (thiếu dữ liệu) thay vì tạo đáp án vô nghĩa.
 */
export function generateQuiz(
  items: VocabularyItem[],
  options: GenerateQuizOptions,
): QuizQuestion[] {
  const random = options.random ?? Math.random;
  let types = options.types ?? [
    "meaning-choice",
    "word-choice",
    "reading-choice",
    "type-word",
  ];
  if (!options.withAudio) {
    types = types.filter((t) => t !== "listen-choice");
  }
  if (types.length === 0) types = ["meaning-choice"];

  const selected = shuffle(items, random).slice(0, options.count);
  const questions: QuizQuestion[] = [];

  selected.forEach((item, index) => {
    const type = types[index % types.length];
    const question = CHOICE_TYPES.includes(type)
      ? makeChoiceQuestion(item, items, type, random)
      : makeInputQuestion(item, type);
    if (question) {
      questions.push(question);
    } else {
      // Fallback an toàn: chọn nghĩa luôn tạo được nếu có ≥2 từ.
      const fallback = makeChoiceQuestion(
        item,
        items,
        "meaning-choice",
        random,
      );
      if (fallback) questions.push(fallback);
    }
  });

  return questions;
}
