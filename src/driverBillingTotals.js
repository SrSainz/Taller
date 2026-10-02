const amount = (value) => Number(value) || 0;
export const getDriverBillingAmount = ({ billing = 0, refunds = 0 } = {}) =>
  Number((Math.max(0, amount(billing)) + Math.max(0, amount(refunds))).toFixed(2));

// A document replaces its day's entry, never the entries for the entire month.
export const getMonthlyDriverBilling = ({ entries = [], billingStatsByDate = new Map(), periodKey, importedBilling = 0 }) => {
  const dailyAmounts = new Map();
  let hasRecordedBillingAmount = false;
  entries.forEach((entry) => {
    const dateKey = String(entry?.entry_date ?? "");
    if (!dateKey.startsWith(`${periodKey}-`)) return;
    dailyAmounts.set(dateKey, {
      billing: getDriverBillingAmount({ billing: entry.billing, refunds: entry.refunds }),
      refunds: Math.max(0, amount(entry.refunds)),
    });
    if (amount(entry.billing) > 0 || entry.billing_override === true) hasRecordedBillingAmount = true;
  });
  billingStatsByDate.forEach((stats, dateKey) => {
    if (!dateKey.startsWith(`${periodKey}-`) || !stats.hasBillingAmount) return;
    dailyAmounts.set(dateKey, {
      billing: getDriverBillingAmount({ billing: stats.netAmount, refunds: stats.refunds }),
      refunds: Math.max(0, amount(stats.refunds)),
    });
    hasRecordedBillingAmount = true;
  });
  const refunds = Number([...dailyAmounts.values()].reduce((sum, value) => sum + value.refunds, 0).toFixed(2));
  const hasRecordedBilling = hasRecordedBillingAmount || refunds > 0;
  return {
    amount: hasRecordedBillingAmount
      ? Number([...dailyAmounts.values()].reduce((sum, value) => sum + value.billing, 0).toFixed(2))
      : Number((Number(importedBilling) + refunds).toFixed(2)),
    refunds,
    hasRecordedBillingAmount,
    hasRecordedBilling,
  };
};
