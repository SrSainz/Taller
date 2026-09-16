import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getCurrentDriverWeekRange, getDriverEditableMonthRange, isDriverDateInEditableWindow } from "../src/driverEditWindow.js";

test("la ventana editable incluye el mes actual y el inmediatamente anterior completos", () => {
  const now = new Date("2026-09-04T10:00:00.000Z");
  assert.deepEqual(getCurrentDriverWeekRange(now), {
    todayDateKey: "2026-09-04",
    startDateKey: "2026-08-31",
    endDateKey: "2026-09-06",
    timeZone: "Europe/Madrid",
  });
  assert.deepEqual(getDriverEditableMonthRange(now), {
    todayDateKey: "2026-09-04",
    startDateKey: "2026-08-01",
    endDateKey: "2026-09-30",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInEditableWindow("2026-08-01", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-07-31", now), false);
  assert.equal(isDriverDateInEditableWindow("2026-09-30", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-10-01", now), false);
});

test("la fecha se calcula con horario de Madrid al pasar la medianoche UTC", () => {
  const now = new Date("2026-09-06T22:30:00.000Z");
  assert.deepEqual(getCurrentDriverWeekRange(now), {
    todayDateKey: "2026-09-07",
    startDateKey: "2026-09-07",
    endDateKey: "2026-09-13",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInEditableWindow("2026-08-01", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-07-31", now), false);
  assert.equal(isDriverDateInEditableWindow("2026-09-30", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-10-01", now), false);
});

test("la ventana cruza correctamente de enero al diciembre anterior", () => {
  const now = new Date("2027-01-16T10:00:00.000Z");
  assert.deepEqual(getDriverEditableMonthRange(now), {
    todayDateKey: "2027-01-16",
    startDateKey: "2026-12-01",
    endDateKey: "2027-01-31",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInEditableWindow("2026-12-01", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-11-30", now), false);
  assert.equal(isDriverDateInEditableWindow("2027-01-31", now), true);
  assert.equal(isDriverDateInEditableWindow("2027-02-01", now), false);
});

test("Supabase aplica la misma ventana mensual a entradas, documentos y almacenamiento", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20260916113437_allow_driver_current_and_previous_month_edits.sql", import.meta.url), "utf8");
  assert.match(migration, /create or replace function private\.is_driver_editable_month\(p_date date\)/);
  assert.match(migration, /date_trunc\('month', today\) - interval '1 month'/);
  assert.match(migration, /date_trunc\('month', today\) \+ interval '1 month'/);
  assert.match(migration, /select private\.is_driver_editable_month\(p_date\)/);
});
