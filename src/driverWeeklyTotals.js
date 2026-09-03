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
 * Normalizes the cash collected amount used by the driver's calendar.
 *
 * Some legacy document extractions stored cash collected with a leading minus
 * sign. It is still the amount collected, so the calendar uses its magnitude
 * before subtracting the expenses shown below it.
 */
export const normalizeDriverCashCollected = (value) => roundCurrency(Math.abs(toAmount(value)));

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
  normalizeDriverCashCollected(cashCollected)
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
