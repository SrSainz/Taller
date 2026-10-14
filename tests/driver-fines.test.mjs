import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getDriverFineHistory, isValidFineDate } from "../src/driverFineHistory.js";

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

test("Multas es un botón pequeño junto a Horario y Facturación muestra solo el total", () => {
  const header = app.slice(app.indexOf('className="driver-performance__name-row"'), app.indexOf('className="driver-performance__grid"'));
  assert.ok(header.indexOf('className="driver-performance__hours-button"') < header.indexOf('className="driver-performance__fines-button"'));
  assert.match(header, /className="driver-performance__header-actions"/);
  assert.match(header, /selectedDriverFines\.length/);
  const billing = app.slice(app.indexOf('className="driver-performance__metric driver-performance__metric--billing"'), app.indexOf('className="driver-performance__metric driver-performance__metric--fuel"'));
  assert.doesNotMatch(billing, /Por hora:|Por km:/);
  assert.doesNotMatch(app, /driver-performance__metric--fines/);
});

test("el historial de multas incluye otros meses y años, pero nunca otros conductores", () => {
  const fines = [
    { id: "oct", driver_id: "alex", fine_date: "2026-10-14", created_at: "2026-10-14T10:00:00Z" },
    { id: "old", driver_id: "alex", fine_date: "2024-01-02", created_at: "2024-01-02T10:00:00Z" },
    { id: "sep", driver_id: "alex", fine_date: "2026-09-30", created_at: "2026-10-01T10:00:00Z" },
    { id: "other", driver_id: "amin", fine_date: "2026-11-01", created_at: "2026-11-01T10:00:00Z" },
  ];
  assert.deepEqual(getDriverFineHistory(fines, "alex").map((fine) => fine.id), ["oct", "sep", "old"]);
  assert.equal(fines[0].id, "oct", "no muta los datos originales");
  assert.deepEqual(getDriverFineHistory(fines, ""), []);
  assert.match(app, /selectedDriverFines\.map\(\(fine\)/);
  assert.doesNotMatch(app, /Sin multas registradas este mes/);
});

test("se pueden registrar fechas históricas válidas sin limitarse al mes visible", () => {
  assert.equal(isValidFineDate("2024-02-29"), true);
  assert.equal(isValidFineDate("2024-02-30"), false);
  assert.equal(isValidFineDate("2025-02-29"), false);
  assert.doesNotMatch(app, /fineDate\.startsWith\(periodStart/);
});
