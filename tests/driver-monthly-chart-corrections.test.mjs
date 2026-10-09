import assert from "node:assert/strict";
import test from "node:test";
import { getDriverMonthlyChartAmount } from "../src/driverMonthlyChartCorrections.js";

test("agosto de 2026 muestra los cinco importes indicados por conductor", () => {
  for (const [name, expected] of Object.entries({ Álex: 6989.85, Tirso: 4257.56, Amin: 3447.19, Mauricio: 5522.55, Fernando: 3318.64 })) {
    assert.equal(getDriverMonthlyChartAmount(name, "2026-08", 0), expected);
  }
});

test("no altera otros meses ni al sexto conductor", () => {
  assert.equal(getDriverMonthlyChartAmount("Álex", "2026-07", 4461.2), 4461.2);
  assert.equal(getDriverMonthlyChartAmount("William", "2026-08", 1234.56), 1234.56);
});
