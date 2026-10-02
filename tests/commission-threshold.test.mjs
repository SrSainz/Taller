import assert from "node:assert/strict";
import test from "node:test";

import { calculateDriverCommission } from "../src/commissionReports.js";

test("las comisiones no se devengan hasta 5.000 euros inclusive", () => {
  const result = calculateDriverCommission({ driverName: "Alex", billing: 5000, tips: 120, tolls: 30, payroll: 1323.72 });

  assert.equal(result.commissionEligible, false);
  assert.equal(result.commissionBase, 0);
  assert.equal(result.thresholdBonus, 0);
  assert.equal(result.commission, 0);
  assert.equal(result.totalBenefitMonth, 0);
  assert.equal(result.totalToCollect, 0);
});

test("al superar 5.000 euros se aplica el porcentaje al total y el primer bono", () => {
  const result = calculateDriverCommission({ driverName: "Alex", billing: 5001, tips: 100, tolls: 20, payroll: 1323.72 });

  assert.equal(result.commissionEligible, true);
  assert.equal(result.commissionBase, 1600.32);
  assert.equal(result.thresholdBonus, 250);
  assert.equal(result.commission, 1850.32);
  assert.equal(result.totalBenefitMonth, 1970.32);
  assert.equal(result.totalToCollect, 646.6);
});

test("los reembolsos se exponen como desglose y la comisión se calcula sobre la facturación que ya los incluye", () => {
  const result = calculateDriverCommission({ driverName: "Alex", billing: 5100, refunds: 100 });
  assert.equal(result.monthlyBilling, 5100);
  assert.equal(result.refunds, 100);
  assert.equal(result.commissionBase, 1632);
});

test("los perfiles nuevos reciben automáticamente el porcentaje general del 30 por ciento", () => {
  const result = calculateDriverCommission({ driverName: "Nueva conductora", billing: 5500 });
  assert.equal(result.commissionRate, 0.30);
  assert.equal(result.commissionBase, 1650);
  assert.equal(result.thresholdBonus, 300);
  assert.equal(result.commission, 1950);
});
