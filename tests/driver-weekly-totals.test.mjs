import assert from "node:assert/strict";
import test from "node:test";

import { accumulateDriverWeekTotals, calculateDriverDailyTotal } from "../src/driverWeeklyTotals.js";

test("los reembolsos reducen el efectivo diario de todos los coches", () => {
  assert.equal(calculateDriverDailyTotal({ cashCollected: 100, fuelCost: 20, refunds: 15 }), 65);
  assert.deepEqual(accumulateDriverWeekTotals([65, 40]), [65, 105]);
});

test("calcula el total diario restando repostaje, reembolsos, lavados y varios", () => {
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

test("recalcula una semana de octubre que empieza en septiembre sin arrastrar la semana anterior", () => {
  const weekFromSeptember = [
    { cashCollected: 20, refunds: 5 },
    { cashCollected: 100, fuelCost: 30, refunds: 10 },
    { cashCollected: 50, washExpenses: 5 },
    { cashCollected: 40, otherExpenses: 8 },
    { cashCollected: 0 },
    { cashCollected: 15, fuelCost: 20 },
    { cashCollected: 25, refunds: 2 },
  ].map(calculateDriverDailyTotal);
  assert.deepEqual(accumulateDriverWeekTotals(weekFromSeptember), [15, 75, 120, 152, 152, 147, 170]);
  assert.deepEqual(accumulateDriverWeekTotals([calculateDriverDailyTotal({ cashCollected: 10, refunds: 3 })]), [7]);
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
