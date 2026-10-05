const nonNegative = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export const getDriverRunningTotalsThroughDay = (calendarRows, selectedDay) => {
  if (!Number.isInteger(selectedDay) || selectedDay < 1) return { hours: 0, fuelCost: 0 };
  const totals = calendarRows.reduce((result, day) => {
    if (day.day > selectedDay) return result;
    result.hours += nonNegative(day.billingStats?.connectionHours);
    result.fuelCost += nonNegative(day.fuelCost);
    return result;
  }, { hours: 0, fuelCost: 0 });
  return { hours: Number(totals.hours.toFixed(1)), fuelCost: Number(totals.fuelCost.toFixed(2)) };
};
