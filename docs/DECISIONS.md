# Nhật ký quyết định (ADR)

Định dạng: Quyết định · Bối cảnh · Lựa chọn · Lý do · Hệ quả.

## ADR-001: HashRouter thay vì BrowserRouter

- **Bối cảnh**: Deploy trên GitHub Pages (static, subpath), refresh route dễ 404.
- **Lựa chọn**: BrowserRouter + 404 fallback, hoặc HashRouter.
- **Lý do**: HashRouter không cần cấu hình server, refresh không 404.
- **Hệ quả**: URL có `#`; chấp nhận được cho MVP.

## ADR-002: IndexedDB (Dexie) cho tiến độ, localStorage cho thiết lập nhỏ

- **Bối cảnh**: Cần lưu tiến độ lớn và một số thiết lập cần đọc rất sớm.
- **Lý do**: IndexedDB phù hợp dữ liệu lớn/có cấu trúc; localStorage đọc sớm cho
  theme/reduced motion/target language.
- **Hệ quả**: Có lớp repository; fallback khi IndexedDB không khả dụng.

## ADR-003: Web Speech API thay vì TTS trả phí

- **Lý do**: MVP chạy client-only, miễn phí, không cần key.
- **Hệ quả**: Chất lượng/giọng phụ thuộc thiết bị; phải xử lý thiếu giọng CJK.

## ADR-004: Không precache video nền trong service worker

- **Lý do**: Video lớn, precache làm phình SW và tốn dữ liệu.
- **Hệ quả**: Dùng runtime caching / tải theo nhu cầu; có poster fallback.

## ADR-005: Tailwind CSS 3 + CSS variables cho theme

- **Lý do**: Ổn định, quen thuộc; CSS variables cho phép đổi theme dễ.

## ADR-006: Dữ liệu từ vựng dạng dataset JSON tĩnh, tải động

- **Lý do**: Không cần backend; code-split theo ngôn ngữ/cấp độ, không bundle hết.
- **Hệ quả**: Cần script validate và chính sách nguồn rõ ràng.
