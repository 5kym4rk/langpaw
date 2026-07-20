/** Taxonomy chủ đề cố định cho lộ trình học (spec P1-V). */

export const CURRICULUM_TOPICS = [
  "greetings",
  "personal-information",
  "family",
  "people",
  "numbers",
  "time",
  "daily-life",
  "food",
  "housing",
  "school",
  "work",
  "shopping",
  "transport",
  "travel",
  "health",
  "feelings",
  "nature",
  "weather",
  "society",
  "culture",
  "communication",
  "science",
  "technology",
  "electronics",
  "telecommunications",
  "job-interview",
  "other",
] as const;

export type CurriculumTopicId = (typeof CURRICULUM_TOPICS)[number];

export const TOPIC_LABELS_VI: Record<CurriculumTopicId, string> = {
  greetings: "Chào hỏi",
  "personal-information": "Thông tin cá nhân",
  family: "Gia đình",
  people: "Con người",
  numbers: "Số đếm",
  time: "Thời gian",
  "daily-life": "Đời sống hằng ngày",
  food: "Ăn uống",
  housing: "Nhà ở",
  school: "Trường học",
  work: "Công việc",
  shopping: "Mua sắm",
  transport: "Giao thông",
  travel: "Du lịch",
  health: "Sức khỏe",
  feelings: "Cảm xúc",
  nature: "Thiên nhiên",
  weather: "Thời tiết",
  society: "Xã hội",
  culture: "Văn hóa",
  communication: "Giao tiếp",
  science: "Khoa học",
  technology: "Công nghệ",
  electronics: "Điện tử",
  telecommunications: "Viễn thông",
  "job-interview": "Phỏng vấn việc làm",
  other: "Khác",
};

export function topicLabelVi(id: string): string {
  return TOPIC_LABELS_VI[id as CurriculumTopicId] ?? id;
}
