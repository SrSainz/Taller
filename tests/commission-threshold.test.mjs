import assert from "node:assert/strict";
import test from "node:test";

import { calculateDriverCommission } from "../src/commissionReports.js";

test("las comisiones no se devengan por debajo de 5.000 euros", () => {
  const result = calculateDriverCommission({ driverName: "Alex", billing: 4999.99, tips: 120, tolls: 30, payroll: 1323.72 });

  assert.equal(result.commissionEligible, false);
  assert.equal(result.commissionBase, 0);
  assert.equal(result.thresholdBonus, 0);
  assert.equal(result.commission, 0);
  assert.equal(result.totalBenefitMonth, 0);
  assert.equal(result.totalToCollect, 0);
});

test("al llegar a 5.000 euros se aplica el porcentaje al total y el primer bono", () => {
  const result = calculateDriverCommission({ driverName: "Alex", billing: 5000, tips: 100, tolls: 20, payroll: 1323.72 });

  assert.equal(result.commissionEligible, true);
  assert.equal(result.commissionBase, 1600);
  assert.equal(result.thresholdBonus, 250);
  assert.equal(result.commission, 1850);
  assert.equal(result.totalBenefitMonth, 1970);
  assert.equal(result.totalToCollect, 646.28);
});
