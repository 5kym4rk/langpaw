# Chính sách dữ liệu

## Nguyên tắc

1. Ưu tiên nguồn uy tín nhưng **không vi phạm giấy phép**.
2. Không scrape hàng loạt nếu điều khoản không cho phép.
3. Dữ liệu tự biên soạn phải ghi rõ và có trạng thái kiểm duyệt.
4. Mỗi mục dẫn tới nguồn phù hợp (`sourceIds`).

## Quy trình nhập → duyệt → cập nhật

1. **Nhập**: script trong `scripts/import-*.ts` hoặc biên soạn thủ công. Key API
   (nếu có) chỉ dùng cục bộ hoặc qua secret CI, không đưa vào frontend.
2. **Validate**: `npm run validate:data` (schema, trùng ID, thiếu nguồn…).
3. **Duyệt**: người kiểm duyệt đổi `reviewStatus` `draft` → `reviewed` →
   `verified`. `verified` bắt buộc có `reviewedBy` + `reviewedAt`.
4. **Cập nhật**: ghi nguồn/ngày vào `DATA_SOURCES.md` và cập nhật CHANGELOG.

## Trạng thái kiểm duyệt

- `draft`: AI/tự biên soạn, chưa đối chiếu nguồn.
- `reviewed`: đã có người rà soát.
- `verified`: đã đối chiếu nguồn, có người & thời điểm kiểm duyệt.

Không đánh dấu `verified` tự động.
