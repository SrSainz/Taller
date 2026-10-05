import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getAccumulatedDriverKmThroughDay } from "../src/driverMileageTotals.js";

test("acumula los km diarios solo hasta el día seleccionado del mes", () => {
  const october = [{ day: 1, km: 303 }, { day: 2, km: 250.5 }, { day: 3, km: 0 }, { day: 4, km: 120 }];
  assert.equal(getAccumulatedDriverKmThroughDay(october, 1), 303);
  assert.equal(getAccumulatedDriverKmThroughDay(october, 3), 553.5);
  assert.equal(getAccumulatedDriverKmThroughDay(october, 4), 673.5);
});

test("el nuevo mes empieza en cero y sirve para cualquier conductor", () => {
  assert.equal(getAccumulatedDriverKmThroughDay([{ day: 1, km: 0 }, { day: 2, km: 75 }], 1), 0);
  assert.equal(getAccumulatedDriverKmThroughDay([], 1), 0);
  assert.equal(getAccumulatedDriverKmThroughDay([{ day: 1, km: 75 }], null), 0);
});

test("la ficha de kilómetros usa el acumulado y nombra el odómetro como Km cuadro", () => {
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /getAccumulatedDriverKmThroughDay\(calendarRows, selectedDay\)/);
  assert.match(app, /<small>Acumulado del Mes<\/small><strong>\{formatKm\(accumulatedKilometresToSelectedDay\)\}/);
  assert.match(app, /<small>Km cuadro<\/small><strong>\{formatKm\(selectedDayDetail\.totalKm\)\}/);
});
