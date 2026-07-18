# Changelog

Định dạng theo tinh thần [Keep a Changelog](https://keepachangelog.com/).

## [1.3.0] — Vòng sửa Batch 3 (nguồn và kiểm duyệt)

### Added / Changed

- **Metadata nguồn mở rộng** (schema + Zod): `sourceEntryUrl`, `sourceEntryId`,
  `definitionSourceLanguage`, `exampleSelfAuthored`, `verificationNote`.
- **P1.9** `SourceDrawer` + nút "Xem nguồn" trên `VocabularyCard`: hiển thị
  nguồn, đơn vị, giấy phép, ngày truy cập, URL entry (nếu có), trạng thái kiểm
  duyệt và ghi chú tự biên soạn.
- **P0.4** Bộ lọc mức kiểm duyệt (`ReviewLevel`: all/reviewed/verified) trong
  `filterVocabulary` + thiết lập `contentReviewLevel`; áp dụng cho Học, Kiểm tra,
  Luyện nghe và Phỏng vấn; có cảnh báo khi không đủ dữ liệu ở mức đã chọn.
- **P1.10** Trang Nguồn dữ liệu: bảng chất lượng theo ngôn ngữ
  (Nháp/Rà soát/Xác minh/%/thiếu entry) qua `computeQuality()`.
- Không tự đổi `draft`→`verified`; giữ nguyên toàn bộ dữ liệu.

### Added (tests)

- `data-quality.test.ts`, mở rộng `vocabulary-filters.test.ts` (reviewLevel).
  Tổng 83 unit + 6 E2E test.

## [1.2.0] — Vòng sửa Batch 2 (đồng bộ tiến độ)

### Added / Changed

- **P1.1** Service dùng chung `recordPracticeResult()` (`practice.ts`): cập nhật
  `VocabularyProgress` (correct/incorrect/streak, new→learning) và daily stats;
  **không** tự đánh dấu "đã thuộc", không đụng lịch SRS.
- Quiz: mỗi câu trả lời ghi tiến độ + thống kê qua service chung; chống double
  submit bằng cờ `savingRef`.
- **P1.2** Luyện nghe: chuyển sang `recordPracticeResult()` (ghi cả tiến độ lẫn
  daily stats) thay vì chỉ daily stats; chống double submit.

### Added (tests)

- `practice.test.ts` — `applyPracticeToProgress` (đúng/sai/không mastered/mark
  weak) + `recordPracticeResult` (lưu progress + stats, cộng dồn).
- `QuizPage.test.tsx` — trả lời quiz ghi tiến độ cho từng mục. Tổng 77 unit test.

## [1.1.0] — Vòng sửa Batch 1 (lỗi P0)

### Fixed / Changed

- **P0.1** Học từ có phase setup/running/completed + màn hoàn thành (số từ, đã
  biết/chưa nhớ, thời gian, tỷ lệ nhớ, học lại từ sai). Chống ghi lặp thẻ cuối
  bằng khóa `savingRef` + phím tắt chỉ bật khi đang chạy. Thêm chọn số từ/phiên.
- **P0.2** Luyện nghe có phase setup/running/result với điểm, đúng/sai, thời
  gian, danh sách từ nghe sai (+ đánh dấu từ yếu, nghe lại từ sai). Ghi thống kê
  học tập; dọn `setTimeout` phát âm khi đổi câu/rời trang.
- **P0.3** Điều hướng mobile: bottom nav gồm 4 mục chính + nút "Thêm" mở bottom
  sheet (focus trap, Escape, click ngoài, aria-expanded/controls, safe-area).
- **P0.5 / P0.6** Dashboard thống kê theo ngôn ngữ đang chọn + biểu đồ 7 ngày
  thật; trang Tiến độ thêm tab theo ngôn ngữ. Bỏ mọi text "Giai đoạn"/"MVP" khỏi
  UI; xóa `PlaceholderPage` không dùng.
- **Feature availability** Disable điều khiển nền động & nhạc khi chưa có tài
  nguyên ("Chưa cài tài nguyên nền" / "Chưa cài gói âm thanh").

### Added (tests)

- Test hoàn thành phiên Học (1 thẻ / nhiều thẻ / chống double click).
- Test màn kết quả Luyện nghe + ghi thống kê.
- Test menu "Thêm" mobile (mở, chứa route phụ, Escape đóng).
- Test `inferLanguageFromId`; E2E `mobile-nav` (360×800). Tổng 70 unit +
  6 E2E test.

## [1.0.0] — Giai đoạn 6: PWA, backup, CI, deploy

### Added

- Sao lưu/khôi phục: `buildBackup`, `downloadBackup`, `parseBackup` (Zod),
  `applyBackup` (hợp nhất/thay thế) + xem trước; `backup-schema.ts`.
- `ConfirmDialog` (quản lý focus, Escape) cho xóa tiến độ và khôi phục mặc định.
- Mục "Dữ liệu" trong Cài đặt: xuất/nhập/xóa/khôi phục.
- Cập nhật PWA: toast "Có phiên bản mới" (`PwaUpdatePrompt`), manifest dùng icon
  SVG, không tự reload giữa phiên.
- E2E Playwright luồng cốt lõi (`tests/e2e/core-flow.spec.ts`).
- Thêm 7 test backup — tổng 61 test. **Hoàn tất MVP.**

## [0.6.0] — Giai đoạn 5: Nền Corgi, nhạc nền, UX

### Added

- Bộ đổi nền (`background-rotation.ts`) — chu kỳ 10 phút, không lặp ngay, một
  timer duy nhất, dừng khi tab ẩn/unmount. Pure function + controller, test bằng
  fake timers (§15.7).
- `DynamicBackground` với poster fallback, overlay độ tối/blur, gradient ấm áp
  khi chưa có video; tôn trọng reduced motion và data saver.
- Nhạc nền tùy chọn (`music.ts`, `MusicManager`) — 4 preset, âm lượng riêng,
  không tự phát trước khi người dùng bật; ducking khi TTS đọc.
- Thiết lập nền & nhạc trong trang Cài đặt.
- Thêm 8 test đổi nền — tổng 54 test.

## [0.5.0] — Giai đoạn 4: Phỏng vấn điện tử - viễn thông

### Added

- Config vai trò/nhóm kiến thức và 10 câu hỏi phỏng vấn mẫu (`config/interview.ts`).
- 40 thuật ngữ phỏng vấn tiếng Anh + 12 thuật ngữ cốt lõi mỗi ngôn ngữ zh/ja/ko
  (tất cả `draft`, dẫn nguồn tham khảo IEC/ITU/NIST, có `conceptId` liên kết).
- Trang Phỏng vấn: lọc theo vị trí & nhóm, chi tiết thuật ngữ đầy đủ (nghĩa,
  giải thích, ví dụ, câu hỏi + câu trả lời mẫu, nghe từng câu, vị trí liên quan).
- Trang Nguồn dữ liệu: tổng hợp nguồn 4 ngôn ngữ + số mục + chú giải trạng thái.
- Component `SourceBadge`; tổng dữ liệu 276 mục.

## [0.4.0] — Giai đoạn 3: SRS và tiến độ

### Added

- Thuật toán SM-2 đơn giản (`srs-scheduler.ts`) + `previewGrades` hiển thị lịch
  ôn dự kiến. Pure function, truyền `now` để test.
- Hàng đợi ôn tập theo ưu tiên (`review-queue.ts`).
- Thống kê hằng ngày + chuỗi ngày học (`stats-repository.ts`, `streak.ts`).
- Trang Ôn tập với 4 mức đánh giá; Trang Tiến độ với biểu đồ 7/30 ngày.
- Ghi daily stats khi học/ôn; Dashboard hiển thị streak & số từ đến hạn.
- Thêm 15 test (SRS scheduler, streak, review queue) — tổng 46 test.

## [0.3.0] — Giai đoạn 2: Quiz, luyện nghe, chế độ tự động

### Added

- Chuẩn hóa đáp án theo ngôn ngữ (`normalize-answer.ts`) + so khớp alternate forms.
- Chọn đáp án nhiễu có trọng số (`distractors.ts`).
- Quiz engine 6 dạng câu hỏi (`quiz-engine.ts`) — pure function, test được.
- Trang Kiểm tra: thiết lập, làm bài trắc nghiệm/tự luận, màn kết quả với danh
  sách câu sai và thêm vào từ yếu.
- Trang Luyện nghe: nghe → chọn nghĩa / nhập từ, tự phát âm.
- Chế độ học tự động (`useAutoLearn.ts`) — vòng lặp có cờ hủy, dừng speech/timer
  khi đổi từ/route/unmount, tạm dừng khi tab ẩn.
- Thêm 15 test (normalize, distractors, quiz engine) — tổng 31 test.

## [0.2.0] — Giai đoạn 1: MVP học từ

### Added

- Lớp lưu trữ Dexie/IndexedDB (`LangPawDatabase`) + progress repository với
  fallback bộ nhớ khi IndexedDB không khả dụng.
- Speech service duy nhất bọc Web Speech API (chọn giọng theo locale, fallback,
  không crash khi thiếu API).
- Data loader tải động theo ngôn ngữ (`import.meta.glob`, code-split từng file).
- 200 từ vựng mẫu tự biên soạn (50 mỗi ngôn ngữ) ở trạng thái `draft`, có nguồn.
- Learning store (Zustand): phiên học, lọc, đã biết/chưa nhớ, yêu thích, từ yếu.
- Flashcard `VocabularyCard`, `SpeechButton`, `ReviewStatusBadge`; trang Học đầy
  đủ với bộ lọc và phím tắt (Space/←/→/R/F).
- Trang chủ hiển thị thống kê thật từ IndexedDB.
- Thêm test: bộ lọc, shuffle, speech service, summarizeProgress (16 test).

## [0.1.0] — Giai đoạn 0: Khởi tạo và nền móng

### Added

- Khởi tạo React + TypeScript (strict) + Vite 6.
- Cấu hình Tailwind CSS, ESLint (flat config), Prettier, Vitest, Playwright.
- App shell responsive (sidebar desktop + bottom nav mobile), HashRouter với 9
  route lazy-load.
- Config ứng dụng, cấu hình 4 ngôn ngữ, hằng số học tập.
- Kiểu dữ liệu TypeScript đầy đủ (vocabulary, progress, settings) và Zod schema.
- Script `validate:data` kiểm tra dataset từ vựng.
- Store settings (Zustand) lưu localStorage.
- Component nền tảng: GlassPanel, PageHeader, EmptyState, LoadingState,
  ErrorBoundary, LanguageSwitcher.
- Tài liệu: README, ARCHITECTURE, DECISIONS, DATA_POLICY, DATA_SOURCES,
  ATTRIBUTIONS, IMPLEMENTATION_STATUS, MANUAL_TEST_CHECKLIST.
- Cấu hình PWA (vite-plugin-pwa) và base path GitHub Pages.
