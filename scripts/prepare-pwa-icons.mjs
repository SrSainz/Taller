#!/usr/bin/env node
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconDirectory = path.join(root, "public", "icons");
const colors = {
  transparent: [0, 0, 0, 0],
  background: [255, 40, 0, 255],
  rubber: [10, 10, 12, 255],
  sidewall: [36, 36, 40, 255],
  tread: [48, 48, 52, 255],
  highlight: [58, 58, 62, 255],
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

const tireColorAt = (x, y, maskable) => {
  const angle = 14 * Math.PI / 180;
  const deltaX = x - 256;
  const deltaY = y - 256;
  const localX = Math.cos(angle) * deltaX - Math.sin(angle) * deltaY;
  const localY = Math.sin(angle) * deltaX + Math.cos(angle) * deltaY;
  const outerX = maskable ? 116 : 132;
  const outerY = maskable ? 150 : 170;
  const innerX = maskable ? 59 : 68;
  const innerY = maskable ? 91 : 104;
  const outer = (localX / outerX) ** 2 + (localY / outerY) ** 2;
  const inner = (localX / innerX) ** 2 + (localY / innerY) ** 2;

  if (outer > 1 || inner < 1) return null;
  if (inner < 1.22) return colors.sidewall;
  if (outer > 0.78 && Math.abs(localX) > outerX * 0.56) {
    const treadPosition = ((localY + outerY) % 39 + 39) % 39;
    if (treadPosition < 14) return colors.tread;
  }
  if (localX < -outerX * 0.48 && localX > -outerX * 0.78 && localY > -outerY * 0.55 && localY < outerY * 0.48) return colors.highlight;
  return colors.rubber;
};

const colorAt = (x, y, maskable) => {
  if (maskable) {
    return tireColorAt(x, y, true) ?? colors.background;
  }

  if (!roundedRectContains(x, y, 0, 0, 512, 512, 112)) return colors.transparent;
  return tireColorAt(x, y, false) ?? colors.background;
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
