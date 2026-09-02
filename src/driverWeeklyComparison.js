const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const positiveOrNull = (value) => {
  const number = toFiniteNumber(value);
  return number > 0 ? number : null;
};

/**
 * Converts the connection duration printed by a billing report into decimal
 * hours. Reports may use the Spanish UI format ("7 h 21 m"), a clock format
 * ("07:21") or an already-decimal value ("7,35"). Invalid and empty values
 * stay at zero so they cannot enter a productivity average.
 */
export const parseConnectionHours = (value) => {
  const rawValue = value && typeof value === "object" && "value" in value ? value.value : value;
  if (typeof rawValue === "number") return rawValue > 0 && Number.isFinite(rawValue) ? rawValue : 0;

  const raw = String(rawValue ?? "").trim().toLocaleLowerCase("es-ES").replace(/\u00a0/g, " ");
  if (!raw) return 0;

  const clock = raw.match(/^(\d{1,3})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?$/);
  if (clock) {
    const hours = Number(clock[1]);
    const minutes = Number(clock[2]);
    const seconds = clock[3] === undefined ? 0 : Number(clock[3]);
    return minutes < 60 && seconds < 60 ? hours + minutes / 60 + seconds / 3600 : 0;
  }

  const hoursMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)\b/);
  const minutesMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:m|min|mins|minuto|minutos)\b/);
  if (hoursMatch || minutesMatch) {
    const hours = hoursMatch ? Number(hoursMatch[1].replace(",", ".")) : 0;
    const minutes = minutesMatch ? Number(minutesMatch[1].replace(",", ".")) : 0;
    return Number.isFinite(hours) && Number.isFinite(minutes) && minutes < 60
      ? Math.max(0, hours + minutes / 60)
      : 0;
  }

  const decimalHours = Number(raw.replace(",", "."));
  return Number.isFinite(decimalHours) && decimalHours > 0 ? decimalHours : 0;
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
    const connectionHours = toFiniteNumber(ownRecord.connectionHours ?? ownRecord.connection_hours)
      || parseConnectionHours(ownRecord.connection);
    const storedKmPerConnectionHour = toFiniteNumber(ownRecord.kmPerConnectionHour ?? ownRecord.kilometresPerConnectionHour ?? ownRecord.km_per_connection_hour);
    const driverKmPerConnectionHour = positiveOrNull(
      storedKmPerConnectionHour > 0
        ? storedKmPerConnectionHour
        : driverKm !== null && connectionHours > 0 ? driverKm / connectionHours : 0,
    );
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

    const totalKmPerConnectionHour = Math.max(0, toFiniteNumber(
      aggregate?.total_km_per_connection_hour ?? aggregate?.totalKmPerConnectionHour,
    ));
    const driversWithKmPerConnectionHour = Math.max(0, Math.round(toFiniteNumber(
      aggregate?.drivers_with_km_per_connection_hour ?? aggregate?.driversWithKmPerConnectionHour,
    )));
    const ownKmPerConnectionHourCounted = driverKmPerConnectionHour !== null;
    const otherKmPerConnectionHourCount = Math.max(
      0,
      driversWithKmPerConnectionHour - (ownKmPerConnectionHourCounted ? 1 : 0),
    );
    const otherKmPerConnectionHourTotal = Math.max(
      0,
      totalKmPerConnectionHour - (ownKmPerConnectionHourCounted ? driverKmPerConnectionHour : 0),
    );
    const otherKmPerConnectionHour = otherKmPerConnectionHourCount > 0
      ? otherKmPerConnectionHourTotal / otherKmPerConnectionHourCount
      : null;

    return {
      key,
      label,
      driverKm,
      otherKm,
      driverKmPerConnectionHour,
      otherKmPerConnectionHour,
      driverConsumption,
      otherConsumption,
    };
  });
};
