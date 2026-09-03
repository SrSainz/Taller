const toAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value ?? "").trim().replace(/\s/g, "");
  if (!raw) return 0;

  const normalized = raw.includes(",") && raw.includes(".")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const roundCurrency = (value) => Number(toAmount(value).toFixed(2));

/**
 * Calculates the amount shown in one driver's daily Total cell.
 *
 * The daily total is cash collected less every expense shown in the weekly
 * calendar. Missing values are intentionally treated as zero.
 */
export const calculateDriverDailyTotal = ({
  cashCollected = 0,
  fuelCost = 0,
  refunds = 0,
  washExpenses = 0,
  otherExpenses = 0,
} = {}) => roundCurrency(
  toAmount(cashCollected)
  - toAmount(fuelCost)
  - toAmount(refunds)
  - toAmount(washExpenses)
  - toAmount(otherExpenses),
);

/**
 * Converts daily totals into the Monday-first running total used by the
 * driver's weekly calendar. The last value is therefore the complete
 * Monday-to-Sunday total for that week.
 */
export const accumulateDriverWeekTotals = (dailyTotals = []) => {
  let runningTotal = 0;
  return (dailyTotals ?? []).map((dailyTotal) => {
    runningTotal = roundCurrency(runningTotal + toAmount(dailyTotal));
    return runningTotal;
  });
};
