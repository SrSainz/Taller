#!/usr/bin/env node
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconDirectory = path.join(root, "public", "icons");
const colors = {
  transparent: [0, 0, 0, 0],
  background: [7, 82, 68, 255],
  surface: [10, 102, 85, 255],
  white: [255, 255, 255, 255],
  soft: [217, 241, 232, 255],
  accent: [143, 210, 187, 255],
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data = Buffer.alloc(0)) => {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
};

const roundedRectContains = (x, y, left, top, width, height, radius) => {
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const distanceX = Math.abs(x - centerX) - (width / 2 - radius);
  const distanceY = Math.abs(y - centerY) - (height / 2 - radius);
  return Math.hypot(Math.max(distanceX, 0), Math.max(distanceY, 0)) + Math.min(Math.max(distanceX, distanceY), 0) <= radius;
};

const capsuleContains = (x, y, startX, endX, centerY, radius) => {
  const closestX = Math.max(startX, Math.min(endX, x));
  return Math.hypot(x - closestX, y - centerY) <= radius;
};

const colorAt = (x, y, maskable) => {
  if (maskable) {
    let color = colors.background;
    if (Math.hypot(x - 256, y - 256) <= 182) color = colors.surface;
    if ((x >= 154 && x <= 358 && y >= 158 && y <= 216) || (x >= 224 && x <= 288 && y >= 216 && y <= 368)) color = colors.white;
    if (roundedRectContains(x, y, 224, 334, 64, 34, 10)) color = colors.soft;
    if (capsuleContains(x, y, 173, 339, 406, 8)) color = colors.accent;
    return color;
  }

  if (!roundedRectContains(x, y, 0, 0, 512, 512, 112)) return colors.transparent;
  let color = colors.background;
  if (roundedRectContains(x, y, 70, 70, 372, 372, 88)) color = colors.surface;
  if ((x >= 132 && x <= 380 && y >= 142 && y <= 206) || (x >= 219 && x <= 293 && y >= 206 && y <= 394)) color = colors.white;
  if (roundedRectContains(x, y, 219, 352, 74, 42, 12)) color = colors.soft;
  if (capsuleContains(x, y, 151, 361, 425, 9)) color = colors.accent;
  return color;
};

const createIcon = (size, maskable) => {
  const stride = size * 4 + 1;
  const pixels = Buffer.alloc(stride * size);
  for (let row = 0; row < size; row += 1) {
    const rowStart = row * stride;
    pixels[rowStart] = 0;
    for (let column = 0; column < size; column += 1) {
      const pointX = ((column + 0.5) / size) * 512;
      const pointY = ((row + 0.5) / size) * 512;
      const offset = rowStart + 1 + column * 4;
      const color = colorAt(pointX, pointY, maskable);
      pixels.set(color, offset);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(pixels, { level: 9 })),
    pngChunk("IEND"),
  ]);
};

mkdirSync(iconDirectory, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(path.join(iconDirectory, `talleria-${size}.png`), createIcon(size, false));
  writeFileSync(path.join(iconDirectory, `talleria-maskable-${size}.png`), createIcon(size, true));
}

console.log("Prepared PWA icons: 192px, 512px, and maskable variants");
