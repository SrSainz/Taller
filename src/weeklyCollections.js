const dateKey = (date) => date.toISOString().slice(0, 10);

export function getWeeksTouchingMonth(month, year) {
  const first = new Date(Date.UTC(year, month, 1));
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const weeks = [];
  for (const monday = new Date(first); monday <= last; monday.setUTCDate(monday.getUTCDate() + 7)) {
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    weeks.push({ start: dateKey(monday), end: dateKey(sunday) });
  }
  return weeks;
}

export function sumWeeklyCollections(weeks, dailyAmounts, vehiclePlates = []) {
  return weeks.map((week) => {
    let billingCents = 0;
    let cashCents = 0;
    const vehicleCents = new Map(vehiclePlates.map((plate) => [plate, { billing: 0, cash: 0 }]));
    for (const [day, amounts] of dailyAmounts) {
      if (day < week.start || day > week.end) continue;
      const dailyBilling = Math.round((Number(amounts.billing) || 0) * 100);
      const dailyCash = Math.round((Number(amounts.cash) || 0) * 100);
      billingCents += dailyBilling;
      cashCents += dailyCash;
      if (amounts.plate) {
        const vehicle = vehicleCents.get(amounts.plate) ?? { billing: 0, cash: 0 };
        vehicle.billing += dailyBilling;
        vehicle.cash += dailyCash;
        vehicleCents.set(amounts.plate, vehicle);
      }
    }
    return { ...week, cash: cashCents / 100, app: (billingCents - cashCents) / 100,
      vehicles: [...vehicleCents].map(([plate, amounts]) => ({ plate, cash: amounts.cash / 100, app: (amounts.billing - amounts.cash) / 100 })) };
  });
}
