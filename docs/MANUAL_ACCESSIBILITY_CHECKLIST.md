# Checklist accessibility thủ công (§12.5)

Đánh dấu `[x]` sau mỗi lần kiểm thử. Ghi ngày và trình duyệt vào cột ghi chú.

## Bàn phím & focus

- [ ] `Tab` đi qua mọi phần tử tương tác theo thứ tự hợp lý.
- [ ] `Shift+Tab` lùi đúng thứ tự.
- [ ] `Enter` / `Space` kích hoạt nút và toggle.
- [ ] `Escape` đóng dialog/menu (Onboarding, ConfirmDialog, SourceDrawer, menu Thêm).
- [ ] Focus bị "bẫy" (focus trap) trong dialog mở.
- [ ] Focus trả về phần tử kích hoạt sau khi đóng dialog.
- [ ] Có chỉ báo focus rõ ràng (không bị `outline: none` không thay thế).

## Zoom & responsive

- [ ] Zoom 200% không mất nội dung, không cuộn ngang toàn trang.
- [ ] 320px, 360px, 390px (mobile) bố cục không vỡ.
- [ ] 768px (tablet), 1366px, 1920px (desktop) ổn.

## Trình đọc màn hình

- [ ] NVDA (Windows): nhãn nút, heading, trạng thái `aria-live` (đồng hồ, toast).
- [ ] Chrome trên Android (TalkBack) điều hướng được.
- [ ] Safari iOS (VoiceOver) nếu có thiết bị.
- [ ] Ảnh trang trí có `aria-hidden`; ảnh nội dung có nhãn.

## Chuyển động & mạng

- [ ] `prefers-reduced-motion`: tắt particle/parallax, vẫn dùng được.
- [ ] Offline: PWA mở được, không mất IndexedDB.
- [ ] Mạng chậm / Save-Data: không preload video, tải nhẹ.

## Màn hình cần soi kỹ (axe + thủ công) (§12.4)

- [ ] Onboarding
- [ ] Menu Thêm (mobile)
- [ ] SourceDrawer
- [ ] ConfirmDialog
- [ ] Quiz
- [ ] Kết quả luyện nghe
- [ ] Màn hoàn thành học từ
- [ ] Recorder khi KHÔNG có quyền micro
- [ ] Heatmap tiến độ
- [ ] Cài đặt
