# Kiến trúc LangPaw

## Sơ đồ tổng thể

```text
Người dùng
   |
   v
React UI + Router (HashRouter)
   |
   +--> Zustand stores (app / learning / settings)
   |
   +--> Feature services
   |      +--> Speech service (bọc Web Speech API)
   |      +--> Session engine
   |      +--> Quiz engine
   |      +--> SRS scheduler (SM-2 đơn giản)
   |      +--> Background rotation service
   |      +--> Backup service
   |
   +--> Data repository
          +--> Static vocabulary JSON (tải động theo ngôn ngữ/cấp độ)
          +--> Dexie / IndexedDB (tiến độ, phiên, thống kê, thiết lập)
```

## Phân lớp

- **Component**: chỉ hiển thị & tương tác gần giao diện.
- **Stores (Zustand)**: trạng thái UI và phiên học.
- **Services / pure functions**: business logic. SRS và tạo câu hỏi độc lập React
  để dễ test (truyền `now` vào để test thời gian ổn định).
- **Repository**: mọi truy cập IndexedDB đi qua đây, không gọi Dexie trực tiếp
  trong component.
- **Speech service duy nhất**: quản lý `speechSynthesis`, cancel khi đổi từ/route.

## Phân chia feature

`src/features/*` — mỗi feature (dashboard, learning, listening, quiz, review,
interview, achievements, sources, settings) có ranh giới rõ ràng và được lazy
load ở cấp route.

## Data flow

Dataset JSON tĩnh → data repository (dynamic import) → stores → components. Tiến
độ học đi từ component → repository → Dexie, và ngược lại khi khôi phục.

## IndexedDB

Dexie database `LangPawDatabase` với các bảng: `progress`, `sessions`,
`dailyStats`, `settings`, `backups`. Bắt đầu version 1, migration trong file
riêng, không xóa dữ liệu người dùng khi đổi schema nếu có thể migrate.

## Speech / SRS / Background / PWA

- **Speech**: service bọc Web Speech API, fallback khi thiếu giọng, không crash.
- **SRS**: biến thể SM-2, 4 mức đánh giá → quality {0,3,4,5}.
- **Background**: đổi nền mỗi 600.000 ms, preload 1 nền kế tiếp, pause khi
  `document.hidden`, cleanup timer.
- **PWA**: vite-plugin-pwa, cache app shell + data JSON; không precache video lớn.
