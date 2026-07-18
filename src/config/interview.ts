import type { InterviewRole } from "@/types";

export const INTERVIEW_ROLE_LABELS: Record<InterviewRole, string> = {
  "rd-engineer": "Kỹ sư R&D",
  "hardware-engineer": "Kỹ sư phần cứng",
  "hardware-test-engineer": "Kỹ sư kiểm thử phần cứng",
  "rf-engineer": "Kỹ sư RF",
  "embedded-firmware-engineer": "Kỹ sư nhúng / firmware",
  "network-telecom-engineer": "Kỹ sư mạng / viễn thông",
  "qa-qc-engineer": "Kỹ sư QA/QC",
  "process-engineer": "Kỹ sư quy trình",
  "production-engineer": "Kỹ sư sản xuất",
  "maintenance-automation-engineer": "Kỹ sư bảo trì / tự động hóa",
  "technical-support-engineer": "Kỹ sư hỗ trợ kỹ thuật",
};

export const INTERVIEW_ROLE_ORDER: InterviewRole[] = [
  "rd-engineer",
  "hardware-engineer",
  "hardware-test-engineer",
  "rf-engineer",
  "embedded-firmware-engineer",
  "network-telecom-engineer",
  "qa-qc-engineer",
  "process-engineer",
  "production-engineer",
  "maintenance-automation-engineer",
  "technical-support-engineer",
];

/** Nhóm kiến thức (§8.3). Dùng làm giá trị `topic` của mục phỏng vấn. */
export const INTERVIEW_GROUPS = [
  "A. Giới thiệu bản thân và công việc",
  "B. Điện tử cơ bản",
  "C. Đo lường, kiểm thử và chất lượng",
  "D. Hệ thống nhúng",
  "E. Viễn thông và mạng",
  "F. Sản xuất điện tử",
] as const;

export type InterviewGroup = (typeof INTERVIEW_GROUPS)[number];

/** 10 câu hỏi phỏng vấn mẫu (§8.5) — hiển thị kèm gợi ý trả lời. */
export const INTERVIEW_QUESTION_CATEGORIES = [
  "Giới thiệu bản thân",
  "Kỹ thuật",
  "Hành vi & tình huống",
] as const;

export type InterviewQuestionCategory =
  (typeof INTERVIEW_QUESTION_CATEGORIES)[number];

export interface InterviewQuestion {
  id: string;
  category: InterviewQuestionCategory;
  /** Câu hỏi bằng tiếng Anh (ngôn ngữ phỏng vấn phổ biến nhất). */
  questionEn: string;
  questionVi: string;
  /** Ý chính cần có trong câu trả lời (tiếng Việt). */
  keyPointsVi: string[];
  /** Câu trả lời mẫu ngắn (tiếng Anh) có placeholder cá nhân. */
  sampleAnswerEn: string;
  /** Từ khóa nên dùng. */
  keywords: string[];
  level: "Cơ bản" | "Trung bình" | "Nâng cao";
}

/**
 * Ngân hàng câu hỏi phỏng vấn. Câu hỏi bằng tiếng Anh — ngôn ngữ phổ biến trong
 * phỏng vấn ngành điện tử tại VN. Câu trả lời mẫu là gợi ý ngắn, có placeholder;
 * người học nên thay bằng thông tin cá nhân, không phóng đại kinh nghiệm.
 */
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q-intro",
    category: "Giới thiệu bản thân",
    questionEn: "Could you introduce yourself?",
    questionVi: "Hãy giới thiệu về bản thân.",
    keyPointsVi: [
      "Tên và ngành học",
      "Trường/kinh nghiệm",
      "Thế mạnh liên quan",
    ],
    sampleAnswerEn:
      "My name is [name]. I graduated in [major] from [school] and I have experience in [field].",
    keywords: ["major", "graduate", "experience"],
    level: "Cơ bản",
  },
  {
    id: "q-graduation",
    category: "Giới thiệu bản thân",
    questionEn: "Please describe your graduation project.",
    questionVi: "Hãy trình bày đồ án tốt nghiệp.",
    keyPointsVi: ["Chủ đề đồ án", "Vai trò của bạn", "Kết quả đạt được"],
    sampleAnswerEn:
      "My graduation project was about [topic]. I was responsible for [role] and achieved [result].",
    keywords: ["graduation project", "responsibility", "result"],
    level: "Cơ bản",
  },
  {
    id: "q-strength-weak",
    category: "Giới thiệu bản thân",
    questionEn: "What are your strengths and weaknesses?",
    questionVi: "Điểm mạnh và điểm yếu của bạn là gì?",
    keyPointsVi: [
      "Một điểm mạnh liên quan công việc",
      "Một điểm yếu và cách cải thiện",
    ],
    sampleAnswerEn:
      "My strength is [strength]. A weakness is [weakness], and I am improving it by [action].",
    keywords: ["strength", "weakness", "improve"],
    level: "Cơ bản",
  },
  {
    id: "q-debug",
    category: "Kỹ thuật",
    questionEn: "How did you solve a difficult technical bug?",
    questionVi: "Bạn đã giải quyết một lỗi kỹ thuật khó như thế nào?",
    keyPointsVi: [
      "Tái hiện lỗi",
      "Tìm nguyên nhân gốc (root cause)",
      "Thử giải pháp và xác nhận",
    ],
    sampleAnswerEn:
      "I reproduced the issue, isolated the root cause step by step, applied a fix, and verified the result.",
    keywords: ["reproduce", "root cause", "verify"],
    level: "Trung bình",
  },
  {
    id: "q-measurement",
    category: "Kỹ thuật",
    questionEn: "What do you do when a measurement result is wrong?",
    questionVi: "Bạn làm gì khi kết quả đo không đúng?",
    keyPointsVi: [
      "Kiểm tra thiết bị đo / hiệu chuẩn",
      "So với thông số kỹ thuật",
      "Tìm nguyên nhân",
    ],
    sampleAnswerEn:
      "I check the instrument and its calibration, compare against the specification, and find the cause.",
    keywords: ["calibration", "specification", "measurement"],
    level: "Trung bình",
  },
  {
    id: "q-board",
    category: "Kỹ thuật",
    questionEn: "How do you check a board that is not working?",
    questionVi: "Bạn kiểm tra một bo mạch không hoạt động như thế nào?",
    keyPointsVi: [
      "Kiểm tra nguồn cấp",
      "Đo điện áp các điểm chính",
      "Tìm ngắn mạch / hở mạch theo sơ đồ",
    ],
    sampleAnswerEn:
      "I check the power supply, measure voltages at key points, and look for a short or open circuit using the schematic.",
    keywords: ["power supply", "voltage", "schematic", "short circuit"],
    level: "Trung bình",
  },
  {
    id: "q-read-docs",
    category: "Kỹ thuật",
    questionEn: "Can you read technical documents in a foreign language?",
    questionVi: "Bạn có thể đọc tài liệu kỹ thuật bằng ngoại ngữ không?",
    keyPointsVi: ["Khẳng định có", "Nêu loại tài liệu (datasheet, tiêu chuẩn)"],
    sampleAnswerEn:
      "Yes. I regularly read datasheets and standard documents in [language].",
    keywords: ["datasheet", "standard", "document"],
    level: "Cơ bản",
  },
  {
    id: "q-conflict",
    category: "Hành vi & tình huống",
    questionEn: "How do you handle conflict in a team?",
    questionVi: "Bạn xử lý mâu thuẫn trong nhóm ra sao?",
    keyPointsVi: [
      "Lắng nghe các bên",
      "Tập trung mục tiêu chung",
      "Giải pháp dựa trên dữ liệu",
    ],
    sampleAnswerEn:
      "I listen to both sides, focus on the shared goal, and find a solution based on data.",
    keywords: ["teamwork", "listen", "goal"],
    level: "Trung bình",
  },
  {
    id: "q-pressure",
    category: "Hành vi & tình huống",
    questionEn: "Can you work under pressure?",
    questionVi: "Bạn có thể làm việc dưới áp lực không?",
    keyPointsVi: [
      "Khẳng định có",
      "Sắp xếp ưu tiên",
      "Giữ bình tĩnh, đảm bảo deadline",
    ],
    sampleAnswerEn:
      "Yes. I prioritize tasks and stay calm to meet the deadline.",
    keywords: ["priority", "deadline", "calm"],
    level: "Cơ bản",
  },
  {
    id: "q-why-company",
    category: "Hành vi & tình huống",
    questionEn: "Why do you want to work at our company?",
    questionVi: "Vì sao bạn muốn làm việc tại công ty chúng tôi?",
    keyPointsVi: [
      "Điểm ngưỡng mộ (sản phẩm/công nghệ)",
      "Mong muốn phát triển kỹ năng",
    ],
    sampleAnswerEn:
      "I admire your [product/technology] and want to grow my skills in [field].",
    keywords: ["product", "technology", "grow"],
    level: "Cơ bản",
  },
  {
    id: "q-shift",
    category: "Hành vi & tình huống",
    questionEn: "Are you willing to work in shifts?",
    questionVi: "Bạn có sẵn sàng làm việc theo ca không?",
    keyPointsVi: ["Trả lời trung thực", "Nêu khả năng sắp xếp"],
    sampleAnswerEn:
      "Yes, I can work in shifts and I can arrange my schedule accordingly.",
    keywords: ["shift", "schedule"],
    level: "Cơ bản",
  },
  {
    id: "q-career-goal",
    category: "Hành vi & tình huống",
    questionEn: "What is your career goal?",
    questionVi: "Mục tiêu nghề nghiệp của bạn là gì?",
    keyPointsVi: ["Mốc thời gian", "Vị trí mong muốn", "Đóng góp"],
    sampleAnswerEn:
      "In [number] years I want to become a [position] and contribute to [field].",
    keywords: ["career goal", "position", "contribute"],
    level: "Cơ bản",
  },
];
