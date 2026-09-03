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

test("los siete días sin datos muestran cero y no arrastran valores", () => {
  assert.deepEqual(accumulateDriverWeekTotals([undefined, null, "", 0, "0,00", NaN, ""]), [0, 0, 0, 0, 0, 0, 0]);
});
