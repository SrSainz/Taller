#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedIcons = [
  ["sobre-ruedas-192.png", 192],
  ["sobre-ruedas-512.png", 512],
  ["sobre-ruedas-maskable-192.png", 192],
  ["sobre-ruedas-maskable-512.png", 512],
];

for (const [filename, expectedSize] of expectedIcons) {
  const iconPath = path.join(root, "public", "icons", filename);
  const bytes = readFileSync(iconPath);
  const signature = bytes.subarray(0, 8).toString("hex");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);

  if (signature !== "89504e470d0a1a0a" || width !== expectedSize || height !== expectedSize) {
    throw new Error(`${filename} must be a ${expectedSize}x${expectedSize} PNG`);
  }
}

console.log("Verified SOBRE RUEDAS PWA icons: 192px, 512px, and maskable variants");
