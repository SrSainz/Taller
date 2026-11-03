import test from "node:test";
import assert from "node:assert/strict";
import { getCommissionText, withCommissionText } from "../src/commissionPresentation.js";
import { calculateDriverCommission } from "../src/commissionReports.js";
test("renombrar conductor y todos los conceptos no cambia ninguna operación", () => {
  const original = { commissionRate: .32, advance: -100, otherConcept: 25, tips: 50 };
  const expected = calculateDriverCommission({ driverName: "Amin", billing: 6000, payroll: 1323.72, adjustments: original });
  let changed = original;
  for (const key of ["driverName", "plate", "monthlyBilling", "commissionRate", "commissionBase", "thresholdBonus", "tips", "totalBenefitMonth", "payroll", "advance", "otherConcept", "totalToCollect"]) changed = withCommissionText(changed, key, `Texto ${key}`);
  assert.deepEqual(calculateDriverCommission({ driverName: "Amin", billing: 6000, payroll: 1323.72, adjustments: changed }), expected);
  assert.equal(getCommissionText(changed, "driverName", "Amin"), "Texto driverName");
  assert.equal(original.display, undefined);
  assert.equal(getCommissionText(withCommissionText(changed, "driverName", null), "driverName", "Amin"), "Amin");
  assert.throws(() => withCommissionText(changed, "driverId", "otro"));
  assert.throws(() => withCommissionText(changed, "driverName", " "));
});
