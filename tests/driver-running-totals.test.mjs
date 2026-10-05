import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getDriverRunningTotalsThroughDay } from "../src/driverRunningTotals.js";

test("horas y consumo crecen día a día dentro del mes seleccionado", () => {
  const month = [
    { day: 1, billingStats: { connectionHours: 4.5 }, fuelCost: 20 },
    { day: 2, billingStats: { connectionHours: 6.2 }, fuelCost: 0 },
    { day: 3, billingStats: { connectionHours: 0 }, fuelCost: 35.75 },
  ];
  assert.deepEqual(getDriverRunningTotalsThroughDay(month, 1), { hours: 4.5, fuelCost: 20 });
  assert.deepEqual(getDriverRunningTotalsThroughDay(month, 2), { hours: 10.7, fuelCost: 20 });
  assert.deepEqual(getDriverRunningTotalsThroughDay(month, 3), { hours: 10.7, fuelCost: 55.75 });
});

test("cada mes comienza en cero y los días sin registros no inventan importes", () => {
  assert.deepEqual(getDriverRunningTotalsThroughDay([], 1), { hours: 0, fuelCost: 0 });
  assert.deepEqual(getDriverRunningTotalsThroughDay([{ day: 1, billingStats: {}, fuelCost: 0 }], 1), { hours: 0, fuelCost: 0 });
  assert.deepEqual(getDriverRunningTotalsThroughDay([{ day: 1, billingStats: { connectionHours: 8 }, fuelCost: 40 }], null), { hours: 0, fuelCost: 0 });
});

test("las tarjetas compartidas por los conductores muestran los acumulados hasta el día abierto", () => {
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /getDriverRunningTotalsThroughDay\(calendarRows, selectedDay\)/);
  assert.match(app, /<small>Horas<\/small><strong>\{runningTotalsToSelectedDay\.hours\.toLocaleString/);
  assert.match(app, /<small>Consumo<\/small><strong>\{formatCurrency\(runningTotalsToSelectedDay\.fuelCost\)\}/);
});
