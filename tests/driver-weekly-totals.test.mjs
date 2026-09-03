import assert from "node:assert/strict";
import test from "node:test";

import { accumulateDriverWeekTotals, calculateDriverDailyTotal } from "../src/driverWeeklyTotals.js";

test("calcula el total diario restando repostaje, reembolsos, lavados y varios al efectivo", () => {
  assert.equal(calculateDriverDailyTotal({
    cashCollected: "150,00",
    fuelCost: 40.25,
    refunds: 5.5,
    washExpenses: 2.75,
    otherExpenses: 1.25,
  }), 100.25);
});

test("acumula el total desde el lunes y el domingo contiene toda la semana", () => {
  assert.deepEqual(accumulateDriverWeekTotals([
    100.25,
    56.25,
    0,
    20.5,
    -10.25,
    35,
    12.75,
  ]), [100.25, 156.5, 156.5, 177, 166.75, 201.75, 214.5]);
});

test("reproduce el acumulado diario del calendario mostrado en la captura", () => {
  const dailyTotals = [
    { cashCollected: 0 },
    { cashCollected: -85.25, fuelCost: 40 },
    { cashCollected: -25.43, washExpenses: 1 },
    { cashCollected: -45.43 },
    { cashCollected: 0 },
    { cashCollected: 0 },
    { cashCollected: 0 },
  ].map(calculateDriverDailyTotal);

  assert.deepEqual(dailyTotals, [0, 45.25, 24.43, 45.43, 0, 0, 0]);
  assert.deepEqual(accumulateDriverWeekTotals(dailyTotals), [0, 45.25, 69.68, 115.11, 115.11, 115.11, 115.11]);
});

test("los siete días sin datos muestran cero y no arrastran valores", () => {
  assert.deepEqual(accumulateDriverWeekTotals([undefined, null, "", 0, "0,00", NaN, ""]), [0, 0, 0, 0, 0, 0, 0]);
});
