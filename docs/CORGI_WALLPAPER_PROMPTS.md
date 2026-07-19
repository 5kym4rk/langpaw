# Prompt tạo ảnh nền Corgi 4K (§16)

Ảnh phải **nguyên bản** (do dự án tạo) hoặc có giấy phép cho phép phân phối.
Không tải lại / hotlink / xóa watermark / sao chép ảnh từ WallpaperCave hay
Pinterest — hai trang đó **chỉ tham khảo thẩm mỹ** (§13.1, §30).

## Phong cách chung (§14)

Pembroke Welsh Corgi · lông cam vàng và trắng · tai dựng · chân ngắn · dễ thương
· giải phẫu đúng (không thừa chân/tai, không méo mặt) · không chữ/logo/watermark ·
cozy · lofi · soft cinematic light · chừa vùng trống cho UI.

## Prompt nền (base)

```
An original 4K digital illustration of a cute Pembroke Welsh Corgi in a cozy
study environment, warm cinematic lighting, polished soft 3D illustration, gentle
lofi atmosphere, rich depth with foreground middle ground and background,
uncluttered composition, large calm negative space for a web application
interface, highly detailed fur, correct anatomy, expressive eyes, no text, no
logo, no watermark, 16:9, 3840x2160.
```

## Negative prompt

```
text, watermark, logo, signature, copyrighted character, extra legs, extra paws,
extra ears, duplicate dog, malformed anatomy, distorted face, blurry eyes, low
resolution, noisy background, oversaturated colors, harsh contrast, busy central
composition, interface mockup, letters, numbers
```

## Quy tắc mỗi scene

- 3 biến thể desktop → chọn 1 bản desktop.
- 1 bản mobile riêng (dọc 9:16), không crop máy móc từ bản desktop.
- Xuất theo §17: AVIF/WebP 4K, WebP 1440/1080, poster mobile; video tùy chọn
  WebM VP9/AV1, 1920x1080, 24fps, 8–15s, muted, loop.

## Sáu scene (§15)

### corgi-morning-study — Morning Study

Bàn học, nắng sáng, cây xanh, laptop, cốc trà. Motion: rèm bay, hơi nước bốc, chớp
mắt, vẫy đuôi.

```
<base prompt> + a corgi studying at a sunny wooden morning desk, houseplants, a
laptop, a cup of tea, gentle morning sunbeams through a window
```

### corgi-rainy-night — Rainy Night

Mưa, đèn bàn, cửa sổ, tông xanh tím và vàng. Motion: mưa rơi, phản chiếu, hơi nước,
chớp mắt.

```
<base prompt> + a corgi by a rainy window at night, warm desk lamp, blue-violet
and amber tones, raindrops on glass, cozy reflections
```

### corgi-cozy-library — Cozy Library

Kệ sách, ghế, ánh sáng vàng. Motion: hạt bụi lơ lửng, trang sách, ánh đèn.

```
<base prompt> + a corgi in a cozy library nook, tall bookshelves, a soft armchair,
warm golden light, floating dust motes
```

### corgi-cafe-study — Café Study

Quán cà phê, thành phố mờ, ánh chiều. Motion: hơi nước, ánh sáng ngoài cửa,
silhouette xa.

```
<base prompt> + a corgi studying in a cozy café, blurred city outside, warm
afternoon light, steam from a coffee cup
```

### corgi-moonlit-bedroom — Moonlit Bedroom

Trăng, đèn dây, phòng ngủ học tập. Motion: sao lấp lánh, rèm, nhịp thở.

```
<base prompt> + a corgi in a moonlit bedroom study corner, string fairy lights,
soft moonlight, calm night mood
```

### corgi-sakura-study — Sakura Study

Cửa sổ, hoa anh đào, tông hồng nhẹ. Motion: cánh hoa rơi, rèm, ánh sáng.

```
<base prompt> + a corgi by a window with cherry blossoms, soft pink tones,
petals drifting in the breeze
```

## Sau khi tạo

1. Đặt file vào `public/backgrounds/<scene-id>/` theo §18.
2. Cập nhật `sizeBytes` thật và `enabled: true`, `hasVideo` đúng thực tế trong
   `public/backgrounds/manifest.json`.
3. Ghi công tại `ATTRIBUTIONS.md` (§26).
4. Chạy `npm run validate:backgrounds`.
