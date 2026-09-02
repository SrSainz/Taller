const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const positiveOrNull = (value) => {
  const number = toFiniteNumber(value);
  return number > 0 ? number : null;
};

export const averagePositive = (values = []) => {
  const positiveValues = (values ?? []).map(toFiniteNumber).filter((value) => value > 0);
  return positiveValues.length > 0
    ? positiveValues.reduce((sum, value) => sum + value, 0) / positiveValues.length
    : 0;
};

/**
 * Combines the selected driver's seven daily readings with privacy-safe fleet
 * aggregates. The aggregate table contains totals and counts only, so the
 * client never needs access to another driver's raw entries or documents.
 * Missing readings remain null so a missing upload does not look like a real
 * zero and is not included in the fleet average.
 */
export const buildDriverWeeklyComparison = ({ days = [], driverRecords = [], comparisonRows = [] } = {}) => {
  const ownByDate = new Map((driverRecords ?? []).map((record) => [String(record?.dateKey ?? record?.entry_date ?? ""), record]));
  const aggregateByDate = new Map((comparisonRows ?? []).map((row) => [String(row?.entry_date ?? row?.dateKey ?? ""), row]));

  return (days ?? []).map(({ key, label }) => {
    const ownRecord = ownByDate.get(String(key)) ?? {};
    const driverKm = positiveOrNull(ownRecord.kilometres ?? ownRecord.dailyKm ?? ownRecord.km);
    const driverConsumption = positiveOrNull(ownRecord.consumption ?? ownRecord.driverConsumption);
    const aggregate = aggregateByDate.get(String(key));
    const totalKm = Math.max(0, toFiniteNumber(aggregate?.total_km ?? aggregate?.totalKm));
    const driversWithKm = Math.max(0, Math.round(toFiniteNumber(aggregate?.drivers_with_km ?? aggregate?.driversWithKm)));
    const ownKmCounted = driverKm !== null;
    const otherKmCount = Math.max(0, driversWithKm - (ownKmCounted ? 1 : 0));
    const otherKmTotal = Math.max(0, totalKm - (ownKmCounted ? driverKm : 0));
    const otherKm = otherKmCount > 0 ? otherKmTotal / otherKmCount : null;

    const totalConsumption = Math.max(0, toFiniteNumber(aggregate?.total_consumption ?? aggregate?.totalConsumption));
    const driversWithConsumption = Math.max(0, Math.round(toFiniteNumber(aggregate?.drivers_with_consumption ?? aggregate?.driversWithConsumption)));
    const ownConsumptionCounted = driverConsumption !== null;
    const otherConsumptionCount = Math.max(0, driversWithConsumption - (ownConsumptionCounted ? 1 : 0));
    const otherConsumptionTotal = Math.max(0, totalConsumption - (ownConsumptionCounted ? driverConsumption : 0));
    const otherConsumption = otherConsumptionCount > 0 ? otherConsumptionTotal / otherConsumptionCount : null;

    return {
      key,
      label,
      driverKm,
      otherKm,
      driverConsumption,
      otherConsumption,
    };
  });
};
