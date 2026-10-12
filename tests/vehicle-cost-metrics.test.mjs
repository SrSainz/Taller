import assert from "node:assert/strict";
import test from "node:test";
import { calculateVehicleCostMetrics, realCostCategoryKeys } from "../src/vehicleCostMetrics.js";

test("el coste real por km incluye los doce conceptos acordados y excluye nóminas", () => {
  const expenses = realCostCategoryKeys.map((key) => ({ key, amount: 10 }));
  expenses.push({ key: "payroll", amount: 500 });
  const metrics = calculateVehicleCostMetrics({ expenses, kilometres: 100, billing: 400 });
  assert.equal(metrics.realCostPerKm, 1.2);
  assert.equal(metrics.fuelPerKm, 0.1);
  assert.equal(metrics.fuelPerBilling, 2.5);
});

test("sin kilómetros o facturación no se muestra un cociente inventado", () => {
  const metrics = calculateVehicleCostMetrics({ expenses: [{ key: "fuel", amount: 20 }] });
  assert.equal(metrics.realCostPerKm, null);
  assert.equal(metrics.fuelPerKm, null);
  assert.equal(metrics.fuelPerBilling, null);
});
