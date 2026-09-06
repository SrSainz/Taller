#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

// New JS/CSS must also change sw.js, otherwise installed PWAs keep old code.
const buildId = createHash("sha256").update(readFileSync(index)).digest("hex").slice(0, 16);
const sw = path.join(dist, "client", "sw.js");
writeFileSync(sw, readFileSync(sw, "utf8").replace(/sobre-ruedas-shell-v\d+/, `sobre-ruedas-shell-${buildId}`));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
