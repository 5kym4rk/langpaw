# Trạng thái triển khai

Trạng thái: ⬜ Chưa làm · 🟡 Đang làm · ✅ Hoàn thành · ⛔ Bị chặn

## Giai đoạn 0 — Khởi tạo và nền móng ✅

- ✅ Khởi tạo React + TypeScript + Vite
- ✅ Cài Tailwind, Router, Zustand, Dexie, Zod
- ✅ Cài ESLint, Prettier, Vitest, Testing Library, Playwright
- ✅ Tạo cấu trúc thư mục
- ✅ App shell (sidebar + bottom nav responsive)
- ✅ Route placeholder cho 9 màn hình + NotFound
- ✅ Config ngôn ngữ + theme cơ bản (CSS variables)
- ✅ Kiểu dữ liệu + Zod schema + script validate:data
- ✅ Tài liệu ban đầu (README, ARCHITECTURE, DECISIONS, DATA_POLICY, …)
- ✅ typecheck / lint / test / build thành công

## Giai đoạn 1 — MVP học từ ✅

- ✅ Data loader tải động (import.meta.glob, code-split theo ngôn ngữ)
- ✅ 50 từ mẫu mỗi ngôn ngữ (en/zh/ko/ja = 200 mục, reviewStatus draft)
- ✅ Flashcard (lật thẻ, phím tắt) + Web Speech API (service duy nhất, fallback)
- ✅ Bộ lọc cấp độ / chủ đề / nhóm từ + ngẫu nhiên
- ✅ Đã biết / Chưa nhớ + yêu thích / từ yếu → Dexie progress (repository)
- ✅ Trang chủ thống kê cơ bản (đọc từ IndexedDB)
- ✅ typecheck / lint / test (16 test) / build thành công; xác minh runtime

## Giai đoạn 2 — Quiz, nghe, tự động ✅

- ✅ Chuẩn hóa đáp án theo ngôn ngữ (trim, NFC, hoa thường EN, bỏ dấu Pinyin)
- ✅ Chọn đáp án nhiễu (ưu tiên loại từ/cấp độ/chủ đề, không trùng nghĩa)
- ✅ Quiz engine: 6 dạng (chọn nghĩa/từ/cách đọc, nghe chọn, điền chỗ trống, nhập)
- ✅ Trang Kiểm tra: thiết lập → làm bài → kết quả (điểm, đúng/sai, thời gian,
  câu sai, thêm vào từ yếu, làm lại)
- ✅ Trang Luyện nghe: nghe → chọn nghĩa / nhập từ, tự phát âm
- ✅ Chế độ học tự động (state machine, hủy speech/timer, pause khi tab ẩn)
- ✅ 31 test pass; typecheck/lint/build; xác minh runtime quiz + listening + auto

## Giai đoạn 3 — SRS và tiến độ ✅

- ✅ SM-2 đơn giản (`srs-scheduler.ts`): 4 mức → quality, ease ≥ 1.3, nextReviewAt
- ✅ Hàng đợi ôn tập ưu tiên (đến hạn → sai nhiều → yếu → lâu chưa gặp)
- ✅ Trang Ôn tập: 4 nút đánh giá kèm lịch ôn dự kiến ("10 phút", "1 ngày"…)
- ✅ Daily stats + streak (Dexie dailyStats, ghi khi học/ôn)
- ✅ Trang Tiến độ: thống kê + phân bố trạng thái + biểu đồ 7/30 ngày
- ✅ Dashboard hiển thị chuỗi ngày học và số từ đến hạn
- ✅ 46 test pass (thêm SRS/streak/queue); typecheck/lint/build; xác minh runtime

## Giai đoạn 4 — Phỏng vấn điện tử - viễn thông ✅

- ✅ Config 11 vị trí + 6 nhóm kiến thức + 10 câu hỏi phỏng vấn mẫu
- ✅ 40 thuật ngữ tiếng Anh (đủ 6 nhóm) + 12 thuật ngữ cốt lõi mỗi ngôn ngữ zh/ja/ko
- ✅ Trang Phỏng vấn: lọc theo vị trí & nhóm, danh sách + chi tiết đầy đủ (§8.4)
- ✅ Câu hỏi + câu trả lời mẫu, nghe từng câu; badge trạng thái kiểm duyệt
- ✅ Trang Nguồn dữ liệu: tổng hợp nguồn 4 ngôn ngữ, số mục, chú giải nhãn
- ✅ 276 mục dữ liệu hợp lệ; typecheck/lint/test(46)/build; xác minh runtime

## Giai đoạn 5 — Corgi background, nhạc, UX ✅

- ✅ Bộ đổi nền (`background-rotation.ts`): đổi mỗi 10 phút, không lặp ngay, 1 timer
- ✅ Component nền động: poster fallback, overlay độ tối/blur, gradient khi thiếu asset
- ✅ Tôn trọng reduced motion + data saver + thiết lập; pause khi tab ẩn
- ✅ Nhạc nền tùy chọn (4 preset, âm lượng riêng, không tự phát trước tương tác)
- ✅ Thiết lập nền & nhạc trong trang Cài đặt (toggle, slider độ tối/blur/âm lượng)
- ✅ 8 test fake-timer (§15.7); tổng 54 test; typecheck/lint/build; xác minh runtime

## Giai đoạn 6 — PWA, backup, CI, deploy ✅

- ✅ Backup: export JSON, import (Zod validate, xem trước, hợp nhất/thay thế)
- ✅ ConfirmDialog (focus + Escape) cho xóa tiến độ / khôi phục mặc định
- ✅ PWA: service worker (precache app shell + JSON), manifest standalone, offline
- ✅ Toast "Có phiên bản mới" khi có service worker mới (không tự reload)
- ✅ CI workflow (validate/typecheck/lint/test/build) + deploy GitHub Pages
- ✅ E2E Playwright luồng cốt lõi (học → reload → phỏng vấn → nguồn → backup)
- ✅ 61 test pass; xác minh runtime backup/dialog/PWA
