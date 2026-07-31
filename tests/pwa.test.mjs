import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "dist", "client", "manifest.webmanifest");
const serviceWorkerPath = path.join(root, "dist", "client", "sw.js");

test("build emits an installable standalone manifest", () => {
  assert.ok(existsSync(manifestPath), "manifest.webmanifest is missing from the build");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/#/informes");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.prefer_related_applications, false);

  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find((item) => item.sizes === size && item.purpose === "any");
    assert.ok(icon, `missing ${size} install icon`);
    assert.ok(existsSync(path.join(root, "dist", "client", icon.src.replace(/^\//, ""))), `${icon.src} is missing`);
  }

  assert.ok(manifest.icons.some((item) => item.purpose === "maskable"), "maskable icon is missing");
});

test("build emits a service worker with offline navigation fallback", () => {
  assert.ok(existsSync(serviceWorkerPath), "sw.js is missing from the build");
  const source = readFileSync(serviceWorkerPath, "utf8");
  assert.match(source, /addEventListener\("install"/);
  assert.match(source, /addEventListener\("fetch"/);
  assert.match(source, /caches\.match\("\/index\.html"\)/);
});
