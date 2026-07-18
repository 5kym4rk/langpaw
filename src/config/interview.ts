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
export interface SampleInterviewQuestion {
  id: string;
  questionVi: string;
  /** Gợi ý trả lời có placeholder để người học thay thông tin cá nhân. */
  answerHintVi: string;
}

export const SAMPLE_INTERVIEW_QUESTIONS: SampleInterviewQuestion[] = [
  {
    id: "q-intro",
    questionVi: "Hãy giới thiệu về bản thân.",
    answerHintVi:
      "Tôi tên là [tên], tốt nghiệp ngành [ngành] tại [trường]. Tôi có kinh nghiệm về [lĩnh vực].",
  },
  {
    id: "q-graduation",
    questionVi: "Hãy trình bày đồ án tốt nghiệp.",
    answerHintVi:
      "Đồ án của tôi về [chủ đề]. Tôi phụ trách [vai trò] và đã [kết quả].",
  },
  {
    id: "q-debug",
    questionVi: "Bạn đã giải quyết một lỗi kỹ thuật như thế nào?",
    answerHintVi:
      "Tôi tái hiện lỗi, khoanh vùng nguyên nhân gốc (root cause), thử nghiệm giải pháp và xác nhận đã khắc phục.",
  },
  {
    id: "q-measurement",
    questionVi: "Bạn làm gì khi kết quả đo không đúng?",
    answerHintVi:
      "Tôi kiểm tra thiết bị đo, hiệu chuẩn (calibration), so với thông số kỹ thuật (specification) và tìm nguyên nhân.",
  },
  {
    id: "q-board",
    questionVi: "Bạn kiểm tra một bo mạch không hoạt động như thế nào?",
    answerHintVi:
      "Tôi kiểm tra nguồn cấp, đo điện áp các điểm chính, tìm ngắn mạch hoặc hở mạch theo sơ đồ (schematic).",
  },
  {
    id: "q-conflict",
    questionVi: "Bạn xử lý mâu thuẫn trong nhóm ra sao?",
    answerHintVi:
      "Tôi lắng nghe các bên, tập trung vào mục tiêu chung và tìm giải pháp dựa trên dữ liệu.",
  },
  {
    id: "q-why-company",
    questionVi: "Vì sao bạn muốn làm việc tại công ty chúng tôi?",
    answerHintVi:
      "Tôi ngưỡng mộ [sản phẩm/công nghệ] của công ty và muốn phát triển kỹ năng về [lĩnh vực].",
  },
  {
    id: "q-pressure",
    questionVi: "Bạn có thể làm việc dưới áp lực không?",
    answerHintVi:
      "Có. Tôi sắp xếp ưu tiên công việc và giữ bình tĩnh để đảm bảo tiến độ (deadline).",
  },
  {
    id: "q-foreign-docs",
    questionVi: "Bạn có thể đọc tài liệu kỹ thuật bằng ngoại ngữ không?",
    answerHintVi:
      "Có. Tôi thường đọc datasheet và tài liệu tiêu chuẩn bằng [ngôn ngữ].",
  },
  {
    id: "q-career-goal",
    questionVi: "Mục tiêu nghề nghiệp của bạn là gì?",
    answerHintVi:
      "Trong [số] năm tới tôi muốn trở thành [vị trí] và đóng góp vào [lĩnh vực].",
  },
];
