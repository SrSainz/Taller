const finitePositive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export const getDriverPerformanceSummary = ({ calendarRows = [], billing = 0, fuelCost = 0, daysInMonth = 0 }) => {
  const hours = calendarRows.reduce((sum, day) => sum + finitePositive(day?.billingStats?.connectionHours), 0);
  const billedDays = calendarRows.filter((day) => finitePositive(day?.billing) > 0).length;
  const monthlyBilling = finitePositive(billing);
  const monthlyFuel = finitePositive(fuelCost);
  return {
    hours: Number(hours.toFixed(1)),
    efficiency: daysInMonth > 0 ? Math.round(billedDays / daysInMonth * 100) : 0,
    fuelToBilling: monthlyBilling > 0 ? monthlyFuel / monthlyBilling * 100 : 0,
    billingPerHour: hours > 0 ? monthlyBilling / hours : 0,
  };
};
