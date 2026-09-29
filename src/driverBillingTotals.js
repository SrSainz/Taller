const amount = (value) => Number(value) || 0;

// A document replaces its day's entry, never the entries for the entire month.
export const getMonthlyDriverBilling = ({ entries = [], billingStatsByDate = new Map(), periodKey, importedBilling = 0 }) => {
  const dailyAmounts = new Map();
  let hasRecordedBilling = false;
  entries.forEach((entry) => {
    const dateKey = String(entry?.entry_date ?? "");
    if (!dateKey.startsWith(`${periodKey}-`)) return;
    dailyAmounts.set(dateKey, amount(entry.billing));
    if (amount(entry.billing) > 0 || entry.billing_override === true) hasRecordedBilling = true;
  });
  billingStatsByDate.forEach((stats, dateKey) => {
    if (!dateKey.startsWith(`${periodKey}-`) || !stats.hasBillingAmount) return;
    dailyAmounts.set(dateKey, amount(stats.netAmount));
    hasRecordedBilling = true;
  });
  return {
    amount: hasRecordedBilling ? Number([...dailyAmounts.values()].reduce((sum, value) => sum + value, 0).toFixed(2)) : importedBilling,
    hasRecordedBilling,
  };
};
