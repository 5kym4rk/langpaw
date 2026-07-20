# Báo cáo dữ liệu học (learning data)

Sinh bởi `npm run build:certs`. Match có ngữ nghĩa: POS (en), pinyin+sense (zh), reading chuẩn hóa (ja), entryId/homonym (ko). learningReady chỉ true khi: có cấp + nghĩa hợp lệ + có cách đọc (zh/ja/ko) + không cần rà soát + không sense mismatch.

## EN — CEFR tham khảo (reference)

| Chỉ số                        | Số lượng |
| ----------------------------- | -------- |
| Tổng kho từ                   | 20098    |
| Khớp certificate              | 3657     |
| Learning ready                | 3546     |
| Requires review               | 101      |
| Sense mismatch                | 0        |
| Invalid meaning               | 636      |
| Missing reading               | 0        |
| Ngoài lộ trình (unclassified) | 16441    |

Theo cấp (khớp / learning-ready):

- A1: 834 khớp / 778 learning-ready
- A2: 661 khớp / 633 learning-ready
- B1: 866 khớp / 855 learning-ready
- B2: 884 khớp / 872 learning-ready
- C1: 234 khớp / 231 learning-ready
- C2: 178 khớp / 177 learning-ready

## ZH — Phân cấp theo HSK 3.0 / GF0025-2021 (official)

| Chỉ số                        | Số lượng |
| ----------------------------- | -------- |
| Tổng kho từ                   | 20070    |
| Khớp certificate              | 3152     |
| Learning ready                | 2662     |
| Requires review               | 488      |
| Sense mismatch                | 488      |
| Invalid meaning               | 255      |
| Missing reading               | 0        |
| Ngoài lộ trình (unclassified) | 16918    |

Theo cấp (khớp / learning-ready):

- HSK 1: 307 khớp / 212 learning-ready
- HSK 2: 301 khớp / 233 learning-ready
- HSK 3: 326 khớp / 262 learning-ready
- HSK 4: 296 khớp / 243 learning-ready
- HSK 5: 363 khớp / 325 learning-ready
- HSK 6: 336 khớp / 278 learning-ready
- HSK 7–9: 1223 khớp / 1109 learning-ready

## JA — JLPT tham khảo (reference)

| Chỉ số                        | Số lượng |
| ----------------------------- | -------- |
| Tổng kho từ                   | 20068    |
| Khớp certificate              | 4134     |
| Learning ready                | 3452     |
| Requires review               | 676      |
| Sense mismatch                | 0        |
| Invalid meaning               | 63       |
| Missing reading               | 695      |
| Ngoài lộ trình (unclassified) | 15934    |

Theo cấp (khớp / learning-ready):

- N5: 405 khớp / 298 learning-ready
- N4: 339 khớp / 259 learning-ready
- N3: 1332 khớp / 1096 learning-ready
- N2: 680 khớp / 580 learning-ready
- N1: 1378 khớp / 1219 learning-ready

## KO — Từ vựng học tiếng Hàn NIKL (reference)

| Chỉ số                        | Số lượng |
| ----------------------------- | -------- |
| Tổng kho từ                   | 10827    |
| Khớp certificate              | 10816    |
| Learning ready                | 9462     |
| Requires review               | 9        |
| Sense mismatch                | 0        |
| Invalid meaning               | 10       |
| Missing reading               | 1335     |
| Ngoài lộ trình (unclassified) | 11       |

Theo cấp (khớp / learning-ready):

- A: 2303 khớp / 2049 learning-ready
- B: 8501 khớp / 7403 learning-ready
- C: 12 khớp / 10 learning-ready

## Ví dụ mục bị loại khỏi learning-ready (và lý do)

- [en] one (en-0024): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="một"
- [en] as (en-vi-00009): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="như; là, với tư cách là"
- [en] go (en-vi-00064): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="sự đi; sức sống; nhiệt tình, sự hăng hái"
- [en] mr (en-vi-00109): nghĩa không đủ chất lượng — "vt của mister"
- [en] ok (en-vi-00127): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="đồng ý, được, tán thành; sự đồng ý, sự tán thành"
- [en] on (en-vi-00129): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="trên, ở trên; dựa trên, dựa vào"
- [en] pc (en-vi-00139): nghĩa không đủ chất lượng — "(vt của Personal Computer) máy tính cá nhân"
- [en] to (en-vi-00191): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="đến, tới, về; cho đến"
- [en] all (en-vi-00252): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="tất cả, hết thảy, toàn bộ, suốt trọn, mọi"
- [en] any (en-vi-00262): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="một, một (người, vật) nào đó (trong câu hỏi); tuyệ"
- [en] far (en-vi-00566): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="xa, xa xôi, xa xăm"
- [en] few (en-vi-00578): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="ít vải; (a few) một vài, một ít"
- [en] her (en-vi-00671): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="nó, cô ấy, bà ấy, chị ấy..."
- [en] his (en-vi-00681): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="của nó, của hắn, của ông ấy, của anh ấy"
- [en] its (en-vi-00743): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="của cái đó, của điều đó, của con vật đó"
- [en] kit (en-vi-00788): nghĩa không đủ chất lượng — "(viết tắt) của kitten; mèo con"
- [en] low (en-vi-00834): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="tiếng rống (trâu bò)"
- [en] man (en-vi-00855): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="người, con người; đàn ông, nam nhi"
- [en] may (en-vi-00861): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="có thể, có lẽ; có thể (được phép)"
- [en] mrs (en-vi-00896): nghĩa không đủ chất lượng — "vt của mistress"
- [en] one (en-vi-00966): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="một; như thế không thay đổi"
- [en] pay (en-vi-00998): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="trả (tiền lương...); nộp, thanh toán; (nghĩa bóng)"
- [en] pro (en-vi-01050): nghĩa không đủ chất lượng — "(viết tắt) của professionaln đấu thủ nhà nghề"
- [en] ski (en-vi-01178): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="Xki, ván trượt tuyết"
- [en] bear (en-vi-01568): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="mang, cầm, vác, đội, đeo, ôm; chịu, chịu đựng"
- [en] best (en-vi-01591): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="tốt nhất, hay nhất, đẹp nhất, giỏi nhất"
- [en] both (en-vi-01669): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="cả hai"
- [en] calf (en-vi-01737): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="con bê; da dê (dùng làm bìa sách, đóng giày) ((cũn"
- [en] damn (en-vi-01932): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="lời nguyền rủa, lời chửi rủa; chút, tí, ít"
- [en] each (en-vi-02099): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="mỗi"
- [en] echo (en-vi-02109): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="tiếng dội, tiếng vang; sự bắt chước mù quáng"
- [en] even (en-vi-02156): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="chiều, chiều hôm"
- [en] good (en-vi-02410): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="tốt, hay, tuyệt; tử tế, rộng lượng, thương người; "
- [en] half (en-vi-02472): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="(một) nửa, phân chia đôi; nửa giờ, ba mươi phút"
- [en] hang (en-vi-02479): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="sự cúi xuống, sự gục xuống; dốc, mặt dốc"
- [en] hurt (en-vi-02593): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="vết thương, chỗ bị đau; điều hại, tai hại"
- [en] lark (en-vi-02819): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="chim chiền chiện"
- [en] last (en-vi-02823): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="khuôn giày, cốt giày"
- [en] late (en-vi-02824): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="muộn, chậm, trễ; (thơ ca) mới rồi, gần đây"
- [en] lean (en-vi-02836): Nhiều POS/cấp, POS từ điển chưa xác minh — meaningVi="độ nghiêng, độ dốc; chỗ nạc"
