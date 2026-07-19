/**
 * Sinh icon PWA (PNG) cho LangPaw mà không cần thư viện raster ngoài.
 * Chạy: npx tsx scripts/generate-icons.ts
 *
 * Thiết kế: nền xanh đêm, khuôn mặt Corgi cam đơn giản (tai, đầu, mõm kem).
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

type RGBA = [number, number, number, number];
const NIGHT: RGBA = [23, 32, 51, 255];
const CORGI: RGBA = [217, 130, 59, 255];
const CREAM: RGBA = [255, 247, 232, 255];
const TRANSPARENT: RGBA = [0, 0, 0, 0];

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size: number, pixels: RGBA[]): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < size; x += 1) {
      const p = pixels[y * size + x];
      const o = rowStart + 1 + x * 4;
      raw[o] = p[0];
      raw[o + 1] = p[1];
      raw[o + 2] = p[2];
      raw[o + 3] = p[3];
    }
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function inCircle(x: number, y: number, cx: number, cy: number, r: number) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function draw(size: number, opts: { rounded: boolean; scale: number }): RGBA[] {
  const px: RGBA[] = new Array(size * size);
  const c = size / 2;
  const s = opts.scale;
  const radius = size * 0.22; // bo góc
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let color: RGBA = NIGHT;
      // Bo góc (chỉ cho icon thường, không cho maskable).
      if (opts.rounded) {
        const inX = Math.min(x, size - 1 - x);
        const inY = Math.min(y, size - 1 - y);
        if (
          inX < radius &&
          inY < radius &&
          (radius - inX) ** 2 + (radius - inY) ** 2 > radius * radius
        ) {
          color = TRANSPARENT;
        }
      }
      if (color !== TRANSPARENT) {
        // Tai trái/phải (cam).
        if (
          inCircle(
            x,
            y,
            c - 0.28 * size * s,
            c - 0.24 * size * s,
            0.14 * size * s,
          ) ||
          inCircle(
            x,
            y,
            c + 0.28 * size * s,
            c - 0.24 * size * s,
            0.14 * size * s,
          )
        ) {
          color = CORGI;
        }
        // Đầu (cam).
        if (inCircle(x, y, c, c, 0.34 * size * s)) color = CORGI;
        // Mõm (kem).
        if (inCircle(x, y, c, c + 0.12 * size * s, 0.18 * size * s)) {
          color = CREAM;
        }
        // Mắt (đêm).
        if (
          inCircle(
            x,
            y,
            c - 0.13 * size * s,
            c - 0.05 * size * s,
            0.045 * size * s,
          ) ||
          inCircle(
            x,
            y,
            c + 0.13 * size * s,
            c - 0.05 * size * s,
            0.045 * size * s,
          )
        ) {
          color = NIGHT;
        }
      }
      px[y * size + x] = color;
    }
  }
  return px;
}

const targets = [
  { name: "icon-192.png", size: 192, rounded: true, scale: 1 },
  { name: "icon-512.png", size: 512, rounded: true, scale: 1 },
  { name: "maskable-512.png", size: 512, rounded: false, scale: 0.72 },
  { name: "apple-touch-icon.png", size: 180, rounded: false, scale: 1 },
];

for (const t of targets) {
  const buf = encodePng(
    t.size,
    draw(t.size, { rounded: t.rounded, scale: t.scale }),
  );
  writeFileSync(path.join(outDir, t.name), buf);
  console.log(`✓ ${t.name} (${t.size}x${t.size}, ${buf.length} bytes)`);
}
console.log("Done.");
