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

export function sumWeeklyCollections(weeks, dailyAmounts) {
  return weeks.map((week) => {
    let billingCents = 0;
    let cashCents = 0;
    for (const [day, amounts] of dailyAmounts) {
      if (day < week.start || day > week.end) continue;
      billingCents += Math.round((Number(amounts.billing) || 0) * 100);
      cashCents += Math.round((Number(amounts.cash) || 0) * 100);
    }
    return { ...week, cash: cashCents / 100, app: (billingCents - cashCents) / 100 };
  });
}
