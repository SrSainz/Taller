import test from "node:test";
import assert from "node:assert/strict";
import { getMonthlyDriverBilling } from "../src/driverBillingTotals.js";

test("a missing or late document does not remove its day's recorded billing", () => {
  const entries = [
    { entry_date: "2026-09-02", billing: 200 },
    { entry_date: "2026-09-03", billing: 233.96 },
  ];
  const billingStatsByDate = new Map([["2026-09-02", { netAmount: 210, hasBillingAmount: true }]]);
  assert.deepEqual(getMonthlyDriverBilling({ entries, billingStatsByDate, periodKey: "2026-09", importedBilling: 1000 }), {
    amount: 443.96,
    hasRecordedBilling: true,
  });
});

test("document corrections and explicit zero overrides take priority over imported values", () => {
  const entries = [{ entry_date: "2026-09-01", billing: 0, billing_override: true }];
  assert.equal(getMonthlyDriverBilling({ entries, periodKey: "2026-09", importedBilling: 500 }).amount, 0);
  assert.equal(getMonthlyDriverBilling({ entries: [], periodKey: "2026-09", importedBilling: 500 }).amount, 500);
});
