const finitePositive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const efficiencyTargets = Object.freeze({
  billingPerHour: 30,
  billingPerKilometre: 0.8,
  litresPer100Km: 5,
  fuelCostShare: 0.1,
});

const cappedScore = (value) => Math.min(1, Math.max(0, value));

export const getDriverPerformanceSummary = ({ calendarRows = [], billing = 0, fuelCost = 0, fuelLiters = 0, daysInMonth = 0, year, month }) => {
  // The calendar carries the validated daily billing reports and their saved corrections.
  const hours = calendarRows.reduce((sum, day) => sum + finitePositive(day?.billingStats?.connectionHours), 0);
  const kilometres = calendarRows.reduce((sum, day) => sum + finitePositive(day?.km), 0);
  const monthlyBilling = finitePositive(billing);
  const monthlyFuel = finitePositive(fuelCost);
  const monthlyLitres = finitePositive(fuelLiters);
  const hasEfficiencyInputs = monthlyBilling > 0 && hours > 0 && kilometres > 0 && monthlyFuel > 0 && monthlyLitres > 0;
  const efficiency = hasEfficiencyInputs
    ? Math.round(25 * (
      cappedScore(monthlyBilling / hours / efficiencyTargets.billingPerHour)
      + cappedScore(monthlyBilling / kilometres / efficiencyTargets.billingPerKilometre)
      + cappedScore(efficiencyTargets.litresPer100Km / (monthlyLitres / kilometres * 100))
      + cappedScore(efficiencyTargets.fuelCostShare / (monthlyFuel / monthlyBilling))
    ))
    : null;
  const firstWeekday = Number.isInteger(year) && Number.isInteger(month)
    ? (new Date(year, month, 1).getDay() + 6) % 7
    : 0;
  const weeks = [];
  for (let firstDay = 1 - firstWeekday; firstDay <= daysInMonth; firstDay += 7) {
    const startDay = Math.max(1, firstDay);
    const endDay = Math.min(daysInMonth, firstDay + 6);
    const rows = calendarRows.filter((day) => Number(day?.day) >= startDay && Number(day?.day) <= endDay);
    const weekBilling = rows.reduce((sum, day) => sum + finitePositive(day?.billing), 0);
    const weekFuel = rows.reduce((sum, day) => sum + finitePositive(day?.fuelCost), 0);
    const weekHours = rows.reduce((sum, day) => sum + finitePositive(day?.billingStats?.connectionHours), 0);
    weeks.push({
      number: weeks.length + 1,
      startDay,
      endDay,
      fuelToBilling: weekBilling > 0 ? weekFuel / weekBilling * 100 : null,
      billingPerHour: weekHours > 0 ? weekBilling / weekHours : null,
    });
  }
  return {
    hours: Number(hours.toFixed(1)),
    efficiency,
    fuelToBilling: monthlyBilling > 0 ? monthlyFuel / monthlyBilling * 100 : 0,
    billingPerHour: hours > 0 ? monthlyBilling / hours : 0,
    weeks,
  };
};
