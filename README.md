# LangPaw 🐾

Ứng dụng web học ngoại ngữ dành cho người Việt, hỗ trợ **Tiếng Anh, Tiếng Trung
giản thể, Tiếng Hàn, Tiếng Nhật**. Progressive Web App chạy hoàn toàn phía trình
duyệt, không cần backend, không cần đăng nhập.

> Tên **LangPaw** là tạm thời và có thể thay đổi.

## Tính năng (theo giai đoạn)

- [x] **Giai đoạn 0** — Nền móng: app shell, điều hướng, theme, tài liệu, CI-ready.
- [x] **Giai đoạn 1** — Học từ bằng flashcard + Web Speech API, 200 từ mẫu, lưu tiến độ IndexedDB.
- [x] **Giai đoạn 2** — Quiz (6 dạng), luyện nghe, chế độ học tự động.
- [x] **Giai đoạn 3** — Ôn lặp lại ngắt quãng (SM-2) + tiến độ, streak, biểu đồ.
- [x] **Giai đoạn 4** — Phỏng vấn điện tử - viễn thông (40+ thuật ngữ, bộ lọc vị trí).
- [x] **Giai đoạn 5** — Nền động (đổi 10 phút, fallback) + nhạc nền tùy chọn.
- [x] **Giai đoạn 6** — PWA offline, backup JSON, CI, deploy GitHub Pages.

## Công nghệ

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS · React Router
(HashRouter) · Zustand · Dexie (IndexedDB) · Zod · Vitest · Playwright · ESLint ·
Prettier · vite-plugin-pwa.

## Yêu cầu môi trường

- Node.js >= 20 (đã kiểm thử với v24).
- npm >= 10.

## Cài đặt & chạy

```bash
npm install
npm run dev            # chạy dev tại http://localhost:5173
npm run validate:data  # kiểm tra dữ liệu từ vựng
npm run typecheck
npm run lint
npm run test
npm run test:e2e       # cần: npx playwright install
npm run build
npm run preview
```

## Cấu trúc dữ liệu

Từ vựng lưu dưới dạng dataset JSON trong `src/data/<lang>/*.json`, kiểm tra bằng
Zod (`src/data/schema.ts`). Mỗi mục có `sourceIds` và `reviewStatus`
(`draft` / `reviewed` / `verified`). Xem `docs/DATA_POLICY.md`.

### Thêm từ mới

1. Thêm mục vào file dataset phù hợp trong `src/data/<lang>/`.
2. Đảm bảo có `sourceIds` trỏ tới nguồn hợp lệ và `reviewStatus`.
3. Chạy `npm run validate:data`.

### Thêm nền mới

Thêm mục vào `public/backgrounds/manifest.json` kèm thông tin giấy phép. Chỉ dùng
tài nguyên tự tạo / public domain / có quyền phân phối.

## Chính sách nguồn

Xem `DATA_SOURCES.md`, `ATTRIBUTIONS.md`, `docs/DATA_POLICY.md`. Không sao chép
hàng loạt dữ liệu không được phép tái phân phối.

## Hạn chế hiện tại

- Dữ liệu (276 mục) ở trạng thái `draft`, cần người bản ngữ kiểm duyệt — đặc biệt
  bản dịch kỹ thuật tiếng Trung/Hàn/Nhật.
- zh/ja/ko mới có 12 thuật ngữ phỏng vấn cốt lõi (tiếng Anh đủ 40).
- Chưa kèm tài nguyên video nền / nhạc có giấy phép → dùng gradient + fallback;
  chỉ cần thêm file vào `public/backgrounds` + manifest là bật nền động.
- `studyMs` (thời gian học) chưa đo thực; E2E cần `npx playwright install` để chạy.

## Giấy phép

Xem `LICENSE`.
