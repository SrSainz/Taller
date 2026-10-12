import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const storage = readFileSync(new URL("../src/supabase.js", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261012170000_driver_fines.sql", import.meta.url), "utf8");

test("las multas quedan archivadas con fecha y foto privada", () => {
  assert.match(migration, /create table if not exists public\.driver_fines/);
  assert.match(migration, /'driver-fines', 'driver-fines', false/);
  assert.match(migration, /alter table public\.driver_fines enable row level security/);
  assert.match(storage, /from\("driver-fines"\)\.upload\(photoPath, photoFile/);
  assert.match(app, /createCachedStorageUrl\(\{ bucket: "driver-fines", path: fine\.photo_path/);
});

test("el calendario marca el día de la multa y abre su registro", () => {
  assert.match(app, /drivers-calendar-day--fine/);
  assert.match(app, /openFineDialog\(dayKey\)/);
  assert.match(app, /Ver foto de la multa del/);
});
