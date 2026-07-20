# Nguồn dữ liệu

Tài liệu này mô tả từng nguồn tham khảo cho dữ liệu từ vựng LangPaw. **Nguyên
tắc:** tham khảo phân cấp/định nghĩa uy tín nhưng KHÔNG sao chép hàng loạt dữ
liệu nếu giấy phép không cho phép tái phân phối. Dữ liệu tự biên soạn được đánh
dấu rõ và ở trạng thái `draft` cho tới khi có người kiểm duyệt.

Mỗi nguồn cần: Tên · Đơn vị phát hành · URL · Mục đích · Giấy phép đã biết · Được
đóng gói hay chỉ tham khảo · Phiên bản/ngày truy cập · Cách ghi công · Rủi ro.

## Tiếng Anh

| Nguồn                      | Đơn vị          | Mục đích                      | Đóng gói?                          | Rủi ro                       |
| -------------------------- | --------------- | ----------------------------- | ---------------------------------- | ---------------------------- |
| Open English WordNet       | OEWN            | Tham khảo nghĩa & quan hệ từ  | Tham khảo, ghi công theo giấy phép | Cần tuân thủ attribution     |
| British Council KBVL       | British Council | Tham khảo lựa chọn & phân cấp | Chỉ tham khảo                      | Không mặc định được sao chép |
| English Vocabulary Profile | Cambridge       | Tham khảo mức CEFR            | Chỉ tham khảo                      | Không tái phân phối          |

Hiển thị: dùng nhãn **"Phân cấp tham khảo theo CEFR"**, không gọi là "danh sách
CEFR chính thức".

## Tiếng Trung

| Nguồn          | Đơn vị                        | Mục đích         | Đóng gói?     | Rủi ro                                                                    |
| -------------- | ----------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------- |
| HSK chính thức | Chinese Testing International | Tham khảo cấp độ | Chỉ tham khảo | Phân biệt HSK cũ 1–6 và HSK mới 3 giai đoạn / 9 bậc qua `syllabusVersion` |

Pinyin luôn hiển thị có dấu thanh (`diànzǐ`).

## Tiếng Hàn

| Nguồn                   | Đơn vị                                | Mục đích            | Đóng gói?                | Rủi ro                                                              |
| ----------------------- | ------------------------------------- | ------------------- | ------------------------ | ------------------------------------------------------------------- |
| Korean Basic Dictionary | National Institute of Korean Language | Cách đọc, nghĩa gốc | Theo điều kiện giấy phép | Nếu cần API key: chỉ trong script/secret CI, không đưa vào frontend |

## Tiếng Nhật

| Nguồn          | Đơn vị           | Mục đích                         | Đóng gói?            | Rủi ro                                     |
| -------------- | ---------------- | -------------------------------- | -------------------- | ------------------------------------------ |
| JF Standard    | Japan Foundation | Tổ chức trình độ giao tiếp A1–B2 | Chỉ tham khảo        | Không tuyên bố "danh sách JLPT chính thức" |
| JMdict / EDRDG | EDRDG            | Cách đọc & thông tin từ          | Theo giấy phép EDRDG | Phải ghi công theo điều kiện               |

## Điện tử - viễn thông

IEC Electropedia · ITU Terms and Definitions · NIST Glossary · O*NET · tài liệu
tiêu chuẩn từ Cisco, 3GPP, IEEE, ARM, Microchip, STMicroelectronics, Texas
Instruments khi được phép trích dẫn. **Chỉ tạo bộ từ chọn lọc, dẫn nguồn từng
khái niệm** — không sao chép toàn bộ cơ sở dữ liệu thuật ngữ.

## Trạng thái hiện tại (2026-07-20)

Kho từ hiện có ~71.000 mục (en ~20.1k, zh ~20.1k, ja ~20.1k, ko ~10.8k), toàn bộ
`reviewStatus: draft`. **Nguồn NGHĨA tiếng Việt theo từng ngôn ngữ (không gộp):**

| Ngôn ngữ     | Nguồn nghĩa Việt              | Ghi chú                                               |
| ------------ | ----------------------------- | ----------------------------------------------------- |
| Trung        | CVDICT (CC BY-SA 4.0)         | nghĩa Việt thật từ từ điển                            |
| Anh          | Gói StarDict en_vi            | **giấy phép CHƯA XÁC MINH — redistribution: unknown** |
| Nhật         | Gói StarDict star_nhatviet    | **giấy phép CHƯA XÁC MINH — redistribution: unknown** |
| Hàn          | 한국어기초사전 (krdict, NIKL) | bản dịch Việt chính thức                              |
| Một phần nhỏ | LangPaw tự biên soạn (seed)   | các bộ seed/interview                                 |

**Nguồn PHÂN CẤP chứng chỉ (vai trò certificate-level, tách với nguồn nghĩa):**

| Lộ trình                            | Tiêu chuẩn (standardAuthority)            | Bản dữ liệu nhập (dataDistributor)                                                                 | Trạng thái                                  |
| ----------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| CEFR tham khảo                      | CEFR-J 1.5 + Octanove C1/C2               | openlanguageprofiles/olp-en-cefrj (CC BY 4.0)                                                      | reference                                   |
| Phân cấp theo HSK 3.0 / GF0025-2021 | GF0025-2021 (MOE/CLEC)                    | krmanik/HSK-3.0 + elkmovie/hsk30 — **bản chép/OCR cộng đồng, không phải bản phát hành chính thức** | official-standard / community-transcription |
| JLPT tham khảo                      | (JLPT không công bố danh sách chính thức) | elzup/jlpt-word-list                                                                               | reference                                   |
| NIKL A/B/C                          | 한국어기초사전 vocabularyLevel (NIKL)     | bản tải JSON chính thức của krdict                                                                 | reference                                   |

Chi tiết số khớp/learning-ready: xem `docs/LEARNING_DATA_REPORT.md` và trang
Nguồn trong ứng dụng.
