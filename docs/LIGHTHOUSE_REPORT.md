# Báo cáo Lighthouse & Accessibility (§12)

## Cách chạy cục bộ

```bash
npm run build
npx lhci autorun            # Lighthouse CI theo lighthouserc.cjs
npx playwright test tests/e2e/accessibility.spec.ts  # axe-core
```

CI: `.github/workflows/lighthouse.yml` chạy cả hai trên mỗi push/PR.

## Mục tiêu (§12.6)

| Chỉ số                  | Ngưỡng    |
| ----------------------- | --------- |
| Performance (desktop)   | ≥ 90      |
| Accessibility           | ≥ 95      |
| Best Practices          | ≥ 95      |
| Cumulative Layout Shift | ≤ 0.1     |
| PWA offline             | Hoạt động |
| IndexedDB               | Không mất |

## Route được kiểm tra

`/#/`, `/#/learn`, `/#/review`, `/#/listen`, `/#/quiz`, `/#/library`,
`/#/interview`, `/#/progress`, `/#/sources`, `/#/settings`.

## Kết quả

> Điền số liệu sau mỗi lần chạy (trước/sau thay đổi). Lighthouse cần Chrome
> headless nên chạy trong CI hoặc máy có Chrome; không chạy trong sandbox test.

| Ngày | Route | Perf | A11y | Best Practices | CLS | Ghi chú |
| ---- | ----- | ---- | ---- | -------------- | --- | ------- |
|      |       |      |      |                |     |         |

## Kết quả axe

2026-07-19 — chạy `tests/e2e/accessibility.spec.ts` trên chromium: **10/10 route
không còn vi phạm serious/critical** (WCAG 2 A/AA).

## Vi phạm axe đã xử lý

| Ngày       | Route                | Rule           | Mức     | Cách xử lý                                                                                     |
| ---------- | -------------------- | -------------- | ------- | ---------------------------------------------------------------------------------------------- |
| 2026-07-19 | settings, interview  | color-contrast | serious | Tách token chữ `--color-danger-text`/`--color-success-text` sáng cho chữ trên nền tối (≥4.5:1) |
| 2026-07-19 | learn, library, quiz | color-contrast | serious | Đổi nền `<select>` từ `bg-night/60` (mờ) sang `bg-night` đặc để chữ ivory đủ tương phản        |
