import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createStorageThumbnail, thumbnailPath } from "../src/storageThumbnails.js";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const storage = readFileSync(new URL("../src/supabase.js", import.meta.url), "utf8");

function storageCache(sign) {
  const context = vm.createContext({ Map, Date, Number, Math, JSON, Error, thumbnailPath,
    supabase: { auth: { onAuthStateChange: () => {} }, storage: { from: () => ({ createSignedUrl: sign }) } } });
  const source = storage.slice(storage.indexOf("const storageUrlCache ="), storage.indexOf("const uploadStorageThumbnail ="));
  vm.runInContext(source.replaceAll("export const ", "var ").replace("const storageUrlCache", "var storageUrlCache"), context);
  return context;
}

test("firmar una miniatura concurrente comparte petición y no usa transformaciones de pago", async () => {
  let calls = 0;
  const context = storageCache(async (...args) => {
    calls++;
    assert.equal(args[0], "driver/billing/2026-09-06/f.jpg.thumbnail.webp");
    assert.equal(args.length, 2);
    return { data: { signedUrl: "https://storage.test/thumbnail" } };
  });
  const options = { bucket: "documents", path: "driver/billing/2026-09-06/f.jpg", transform: { width: 320 } };
  const [a,b] = await Promise.all([context.createCachedStorageUrl(options), context.createCachedStorageUrl(options)]);
  assert.equal(a.signedUrl, b.signedUrl);
  await context.createCachedStorageUrl(options);
  assert.equal(calls, 1);
});

test("miniatura ausente tiene enfriamiento y nunca descarga el original como fallback", async () => {
  let calls = 0;
  const context = storageCache(async (path) => { calls++; assert.ok(path.endsWith(".thumbnail.webp")); return { error: new Error("missing") }; });
  const options = { bucket: "documents", path: "receipt.jpg", transform: { width: 320 } };
  await context.createCachedStorageUrl(options);
  await context.createCachedStorageUrl(options);
  assert.equal(calls, 1);
  context.clearCachedStorageUrl(options);
  await context.createCachedStorageUrl(options);
  assert.equal(calls, 2);
});

test("documentos no compatibles no se transforman ni se pierden", async () => {
  assert.equal(await createStorageThumbnail({ type: "application/pdf" }), null);
  assert.equal(await createStorageThumbnail({ type: "image/heic" }), null);
  assert.equal(thumbnailPath("owner/path.jpg"), "owner/path.jpg.thumbnail.webp");
});

test("no reaparece polling y seleccionar un día no recrea Realtime", () => {
  assert.doesNotMatch(app, /setInterval\(/);
  assert.match(app, /\[activeProfileId, canQueryDriverData, preview, session.user.id\]\);/);
  assert.match(app, /driverSyncHandlersRef.current.syncDriverRealtimeRecord/);
  assert.match(app, /Math.max\(driverLastFullRefreshAtRef.current, driverLastRefreshAttemptRef.current\)/);
  assert.match(app, /Math.max\(adminLastFullRefreshAtRef.current, adminLastRefreshAttemptRef.current\)/);
});

test("fallar al marcar un aviso no lo presenta como revisado", () => {
  assert.match(app, /reviewedReports.get\(report.id\) \?\? report/);
  assert.doesNotMatch(app, /reviewedReports.get\(report.id\) \?\? \{ .*status: "reviewed"/);
});

test("el visor no pierde el control de la pestaña antes de recibir la URL privada", () => {
  assert.doesNotMatch(app, /window.open\("about:blank", "_blank", "noopener,noreferrer"\)/);
  assert.equal((app.match(/popup.opener = null/g) ?? []).length, 2);
});

test("service worker no intercepta APIs privadas y reutiliza assets inmutables", async () => {
  const handlers = {};
  let fetched = 0;
  const cached = { fromCache: true };
  const context = vm.createContext({ URL, self: { location: { origin: "https://app.test" }, addEventListener: (name, callback) => { handlers[name] = callback; } },
    fetch: async () => { fetched++; }, caches: { match: async () => cached } });
  vm.runInContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), context);
  handlers.fetch({ request: { method: "GET", url: "https://app.test/api/private" }, respondWith: () => assert.fail("API cached") });
  let response;
  handlers.fetch({ request: { method: "GET", url: "https://app.test/assets/app-hash.js" }, respondWith: p => { response=p; } });
  assert.equal(await response, cached);
  assert.equal(fetched, 0);
});
