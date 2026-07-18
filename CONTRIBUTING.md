# Đóng góp cho LangPaw

## Quy trình

1. Chạy `npm install`.
2. Tạo nhánh feature.
3. Trước khi commit, đảm bảo pass:
   ```bash
   npm run validate:data
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```
4. Giữ commit nhỏ, thông điệp rõ ràng (xem thứ tự gợi ý trong đặc tả §28).

## Nguyên tắc mã nguồn

- TypeScript strict, không dùng `any` tùy tiện.
- Business logic (SRS, quiz, chuẩn hóa) là pure function, độc lập React, có test.
- Truy cập IndexedDB qua repository, không gọi Dexie rải rác trong component.
- Speech Synthesis chỉ qua một service duy nhất.
- Mọi timer/audio phải được cleanup khi unmount.

## Dữ liệu

- Mỗi mục từ vựng phải có `sourceIds` và `reviewStatus`.
- Không đánh dấu `verified` tự động — cần người kiểm duyệt.
- Không nhập hàng loạt dữ liệu không rõ giấy phép.
