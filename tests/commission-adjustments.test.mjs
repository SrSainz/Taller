import test from "node:test";
import assert from "node:assert/strict";
import { calculateDriverCommission } from "../src/commissionReports.js";
test("las casillas manuales recalculan dependencias y admiten cero", () => {
  const base = { driverName: "Fernando", billing: 6100, refunds: 100, payroll: 1300, tips: 20 };
  const result = calculateDriverCommission({ ...base, adjustments: { commissionRate: .4, thresholdBonus: 300, tips: 50 } });
  assert.equal(result.monthlyBilling, 6000); assert.equal(result.commissionBase, 2400);
  assert.equal(result.totalBenefitMonth, 2750); assert.equal(result.totalToCollect, 1450);
  const total = calculateDriverCommission({ ...base, adjustments: { totalBenefitMonth: 3000 } });
  assert.equal(total.totalToCollect, 1700);
  assert.equal(calculateDriverCommission({ ...base, adjustments: { totalToCollect: 0 } }).totalToCollect, 0);
  assert.equal(calculateDriverCommission({ ...base, adjustments: { commissionBase: 0, thresholdBonus: 0, tips: 0 } }).totalBenefitMonth, 0);
  assert.equal(calculateDriverCommission({ ...base, adjustments: { monthlyBilling: 7000 } }).monthlyBilling, 7000);
});
test("los reembolsos no generan comisión mensual ni tramos y conservan la cifra semanal", () => {
  const result = calculateDriverCommission({ driverName: "Fernando", billing: 5200, refunds: 200 });
  assert.equal(result.monthlyBilling, 5000); assert.equal(result.commissionBase, 0); assert.equal(result.thresholdBonus, 0); assert.equal(result.refunds, 200);
});
