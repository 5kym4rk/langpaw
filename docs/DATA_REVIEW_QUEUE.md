# Hàng đợi rà soát dữ liệu (§4.3)

Mọi mục nhập từ nguồn có giấy phép đều ở trạng thái `draft` cho tới khi có người
rà soát (`reviewed`) và đối chiếu nguồn cụ thể (`verified`). **Không** tự động
nâng `draft → verified` (§4.1). Nghĩa Việt và ví dụ do dự án biên soạn.

Quy trình: `draft → reviewed → verified`.

- `reviewed`: có người rà soát, có `reviewedBy` + `reviewedAt`.
- `verified`: thêm nguồn cụ thể (`sourceEntryUrl`/`sourceEntryId`) + ghi chú xác
  minh; chỉ đặt khi đã đối chiếu đúng entry gốc.

Các script importer tự dồn những seed **không tra được trong nguồn** xuống bảng
dưới (mức ưu tiên cao) để người rà soát bổ sung thủ công.

| Ngôn ngữ | Từ  | Nghĩa Việt | Cách đọc | Ví dụ | Nguồn | Lỗi nghi ngờ | Ưu tiên | Người rà soát | Trạng thái |
| -------- | --- | ---------- | -------- | ----- | ----- | ------------ | ------- | ------------- | ---------- |
