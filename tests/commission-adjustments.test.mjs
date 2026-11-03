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

test("adelanto y otro concepto suman o restan al pendiente sin duplicar el adelanto como gasto", () => {
  const base = { driverName: "Fernando", billing: 6000, payroll: 1300 };
  const original = calculateDriverCommission(base);
  const result = calculateDriverCommission({ ...base, adjustments: { advance: -100, otherConcept: 25 } });
  assert.equal(result.totalToCollect, original.totalToCollect - 75);
  assert.equal(result.commissionExpense, original.commissionExpense + 25);
  const manual = calculateDriverCommission({ ...base, adjustments: { totalToCollect: 1000, advance: -100, otherConcept: -25 } });
  assert.equal(manual.totalToCollect, 875);
  assert.equal(calculateDriverCommission({ ...base, adjustments: { advance: 100, otherConcept: -25 } }).totalToCollect, original.totalToCollect + 75);
  assert.equal(calculateDriverCommission({ driverName: "Fernando", billing: 0, adjustments: { advance: -100 } }).totalToCollect, -100);
});
