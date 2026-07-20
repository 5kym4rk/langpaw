# Ghi công (Attributions)

## Thư viện phần mềm

Xem `package.json`. Các thư viện chính (React, Vite, Tailwind, Zustand, Dexie,
Zod, Lucide) được phát hành theo giấy phép MIT/ISC tương ứng.

## Biểu tượng

- [Lucide](https://lucide.dev) — ISC License.

## Dữ liệu từ vựng

Xem `DATA_SOURCES.md`. Từng nguồn được ghi công theo điều kiện giấy phép của
nguồn đó. Dữ liệu gốc (headword, cách đọc, POS, định nghĩa, entry id) lấy từ các
nguồn dưới đây; **nghĩa Việt và câu ví dụ do LangPaw tự biên soạn** và ở trạng
thái `draft` cho tới khi được rà soát/kiểm duyệt.

### Open English WordNet (tiếng Anh)

- Nguồn: https://en-word.net/ — kho: https://github.com/globalwordnet/english-wordnet
- Giấy phép: **CC BY 4.0**
- Sử dụng: lemma, part of speech, definition, synset id cho tập từ chọn lọc.
- Importer: `scripts/import-english-wordnet.ts` → `src/data/en/generated/`.

### CC-CEDICT (tiếng Trung)

- Nguồn: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
- Giấy phép: **CC BY-SA 4.0**
- Sử dụng: giản thể/phồn thể, pinyin, nghĩa tiếng Anh cho tập từ chọn lọc.
- Importer: `scripts/import-cc-cedict.ts` → `src/data/zh/generated/`.
- Phân cấp cấp độ dùng GF0025-2021 (không trộn HSK cũ mà không ghi phiên bản).

### JMdict (tiếng Nhật)

- Nguồn: https://www.edrdg.org/jmdict/j_jmdict.html — giấy phép:
  https://www.edrdg.org/edrdg/licence.html
- Giấy phép: **CC BY-SA 4.0** (EDRDG). Không nhập proper names.
- Sử dụng: kanji, kana, part of speech, English gloss, ent_seq cho tập từ chọn lọc.
- Importer: `scripts/import-jmdict.ts` → `src/data/ja/generated/`.

### Korean Basic Dictionary — krdict (tiếng Hàn)

- Nguồn: https://krdict.korean.go.kr/ (Open API)
- Giấy phép: theo điều khoản krdict Open API; API key chỉ dùng trong script
  (`.env.import.local`, không commit, không đưa vào frontend).
- Sử dụng: cách đọc, nghĩa gốc, target_code (entry id); không tải multimedia.
- Importer: `scripts/import-korean-dictionary.ts` → `src/data/ko/generated/`.

## Nền (Corgi) và nhạc

Manifest 6 scene đã khai báo tại `public/backgrounds/manifest.json` với
`enabled: false` cho tới khi có tài nguyên thật. Prompt tạo ảnh: xem
`docs/CORGI_WALLPAPER_PROMPTS.md`. Nguồn media hợp lệ (§13.2): Pexels, Pixabay,
Openverse, Freesound (chỉ CC0/CC BY, không CC BY-NC). **Không** dùng ảnh từ
WallpaperCave/Pinterest (chỉ tham khảo thẩm mỹ), không hotlink, không xóa
watermark.

Mỗi asset khi bổ sung phải điền một khối dưới đây và cập nhật `sizeBytes` +
`enabled` trong manifest.

### Asset nguyên bản (do dự án tạo)

```markdown
## <Scene> (ví dụ: Corgi Rainy Night)

- Author: LangPaw project
- License: Project-owned
- Generated/created with:
- Created at:
- Modifications:
- Files:
```

### Asset bên ngoài (Pexels/Pixabay/Openverse/Freesound)

```markdown
## <Scene>

- Author:
- Original page: <URL trang cụ thể, không phải trang tìm kiếm>
- License:
- License URL:
- Downloaded at:
- Modifications:
- Files:
```

### Nền Corgi động (6 scene đang bật)

- **Author:** 도기코기 (Doggie Corgi)
- **License:** Được tác giả cho phép sử dụng (qua email, 2026-07-19).
- **Original page:** _cần bổ sung URL kênh/clip gốc chính xác của tác giả._
- **Modifications:** cắt đoạn loop ~10 giây, tắt tiếng (muted), chuyển WebM VP9
  1080p + poster WebP (desktop 1080 và mobile 9:16) bằng ffmpeg.
- **Files:** `public/backgrounds/corgi-{warmth,good-things,waiting,endless-road,knock,missed-cat}/`
  gồm `loop-1080.webm`, `poster-1080.webp`, `poster-mobile.webp`.

### Nhạc nền (ASMR)

- **Author:** 도기코기 (Doggie Corgi)
- **License:** Được tác giả cho phép sử dụng (qua email, 2026-07-19).
- **Original page:** _cần bổ sung URL clip gốc chính xác của tác giả._
- **Modifications:** tách âm thanh đoạn ~90 giây, fade in/out, xuất MP3 96kbps
  bằng ffmpeg.
- **Files:** `public/audio/{rain,waves,forest,water}.mp3` (Tiếng mưa / Tiếng
  sóng / Rừng thu / Dưới nước).

> Giữ nguyên phần media chưa dùng chỉ để tham khảo thẩm mỹ (WallpaperCave,
> Pinterest) — KHÔNG đóng gói. Không hotlink; không dùng ảnh không rõ quyền.
