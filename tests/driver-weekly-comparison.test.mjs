import test from "node:test";
import assert from "node:assert/strict";

import { averagePositive, buildDriverWeeklyComparison } from "../src/driverWeeklyComparison.js";

test("calcula la media diaria del resto sin contar al conductor seleccionado dos veces", () => {
  const series = buildDriverWeeklyComparison({
    days: [
      { key: "2026-09-01", label: "mar" },
      { key: "2026-09-02", label: "mié" },
      { key: "2026-09-03", label: "jue" },
    ],
    driverRecords: [
      { dateKey: "2026-09-01", kilometres: 100, consumption: 4 },
      { dateKey: "2026-09-02", kilometres: 0, consumption: 0 },
    ],
    comparisonRows: [
      { entry_date: "2026-09-01", total_km: 300, drivers_with_km: 2, total_consumption: 8.5, drivers_with_consumption: 2 },
      { entry_date: "2026-09-02", total_km: 120, drivers_with_km: 1, total_consumption: 4.2, drivers_with_consumption: 1 },
      { entry_date: "2026-09-03", total_km: 0, drivers_with_km: 0, total_consumption: 0, drivers_with_consumption: 0 },
    ],
  });

  assert.equal(series[0].driverKm, 100);
  assert.equal(series[0].otherKm, 200);
  assert.equal(series[0].otherConsumption, 4.5);
  assert.equal(series[1].driverKm, null);
  assert.equal(series[1].otherKm, 120);
  assert.equal(series[1].otherConsumption, 4.2);
  assert.equal(series[2].driverKm, null);
  assert.equal(series[2].otherKm, null);
  assert.equal(series[2].otherConsumption, null);
});

test("los valores ausentes no se convierten en ceros dentro de la serie", () => {
  const [point] = buildDriverWeeklyComparison({
    days: [{ key: "2026-09-01", label: "mar" }],
    driverRecords: [],
    comparisonRows: [],
  });

  assert.deepEqual(point, {
    key: "2026-09-01",
    label: "mar",
    driverKm: null,
    otherKm: null,
    driverConsumption: null,
    otherConsumption: null,
  });
});

test("promedia solo registros positivos", () => {
  assert.equal(averagePositive([100, 0, null, 200]), 150);
  assert.equal(averagePositive([0, null]), 0);
});
