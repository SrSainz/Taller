export const profileDateForPeriod = (value) => String(value ?? "").slice(0, 10);

export const isDriverProfileValidOnDate = (profile, date) => {
  const dateKey = profileDateForPeriod(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const effectiveFrom = profileDateForPeriod(profile?.effective_from) || "1900-01-01";
  const effectiveTo = profileDateForPeriod(profile?.effective_to) || "9999-12-31";
  return dateKey >= effectiveFrom && dateKey <= effectiveTo;
};

export const isDriverProfileValidDuringPeriod = (profile, periodStart, periodEnd) => {
  const effectiveFrom = profileDateForPeriod(profile?.effective_from) || "1900-01-01";
  const effectiveTo = profileDateForPeriod(profile?.effective_to) || "9999-12-31";
  return effectiveFrom <= periodEnd && effectiveTo >= periodStart;
};

export const driverProfileCoversWholePeriod = (profile, periodStart, periodEnd) => {
  const effectiveFrom = profileDateForPeriod(profile?.effective_from) || "1900-01-01";
  const effectiveTo = profileDateForPeriod(profile?.effective_to) || "9999-12-31";
  return effectiveFrom <= periodStart && effectiveTo >= periodEnd;
};
