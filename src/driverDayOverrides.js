import { parseConnectionHours } from "./driverWeeklyComparison.js";

const toNumber = (value, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const raw = String(value ?? "").trim().replace(/[^\d,.-]/g, "");
  if (!raw) return fallback;
  const normalized = raw.includes(",") && raw.includes(".")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const amount = (value, fallback = 0) => Math.max(0, toNumber(value, fallback));
const integer = (value, fallback = 0) => Math.max(0, Math.round(toNumber(value, fallback)));
const roundMoney = (value) => Number(amount(value).toFixed(2));
const hasOwn = (value, key) => Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key));
const objectOrEmpty = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const getDriverDayOverrides = (entry) => objectOrEmpty(entry?.manual_overrides);

export const getDriverDayOverride = (entry, mode) => {
  const override = getDriverDayOverrides(entry)?.[mode];
  return override && typeof override === "object" && !Array.isArray(override) ? override : null;
};

export const mergeDriverDayOverride = (entry, mode, value) => ({
  ...getDriverDayOverrides(entry),
  [mode]: { ...objectOrEmpty(getDriverDayOverride(entry, mode)), ...objectOrEmpty(value) },
});

export const buildDriverBillingOverride = ({
  connection = "",
  trips = 0,
  points = 0,
  baseNetAmount = 0,
  promotions = 0,
  tips = 0,
  refunds = 0,
  cashCollected = 0,
} = {}) => {
  const base = roundMoney(baseNetAmount);
  const promotionAmount = roundMoney(promotions);
  const netAmount = roundMoney(base + promotionAmount);
  const tipAmount = roundMoney(tips);
  return {
    connection: String(connection ?? "").trim(),
    trips: integer(trips),
    points: integer(points),
    baseNetAmount: base,
    promotions: promotionAmount,
    netAmount,
    tips: tipAmount,
    total: roundMoney(netAmount + tipAmount),
    refunds: roundMoney(refunds),
    cashCollected: roundMoney(Math.abs(toNumber(cashCollected))),
  };
};

export const applyDriverBillingOverride = (stats = {}, entry) => {
  const override = getDriverDayOverride(entry, "billing");
  if (!override) return stats;

  const base = roundMoney(hasOwn(override, "baseNetAmount") ? override.baseNetAmount : stats.baseNetAmount);
  const promotions = roundMoney(hasOwn(override, "promotions") ? override.promotions : stats.promotions);
  const netAmount = roundMoney(hasOwn(override, "netAmount") ? override.netAmount : base + promotions);
  const tips = roundMoney(hasOwn(override, "tips") ? override.tips : stats.tips);
  return {
    ...stats,
    connection: hasOwn(override, "connection") ? String(override.connection ?? "").trim() : stats.connection ?? "",
    connectionHours: hasOwn(override, "connection")
      ? parseConnectionHours(override.connection)
      : stats.connectionHours ?? parseConnectionHours(stats.connection),
    trips: integer(hasOwn(override, "trips") ? override.trips : stats.trips),
    points: integer(hasOwn(override, "points") ? override.points : stats.points),
    baseNetAmount: base,
    promotions,
    netAmount,
    tips,
    total: roundMoney(hasOwn(override, "total") ? override.total : netAmount + tips),
    refunds: roundMoney(hasOwn(override, "refunds") ? override.refunds : stats.refunds),
    cashCollected: roundMoney(Math.abs(toNumber(hasOwn(override, "cashCollected") ? override.cashCollected : stats.cashCollected))),
    hasBillingAmount: true,
  };
};

const normalizeFuelEntry = (entry, dateKey, index, cost, liters) => ({
  ...entry,
  id: entry?.id ?? `manual-fuel-${dateKey}-${index + 1}`,
  date: dateKey,
  time: entry?.time ?? "",
  liters: roundMoney(liters),
  cost: roundMoney(cost),
  manual: true,
});

/**
 * Returns the visible refuelling rows for a manually corrected day. The
 * original transaction rows are kept as the source document history; this
 * projection only changes the values/count shown by the daily editor and its
 * summaries.
 */
export const buildDriverFuelOverrideEntries = ({ override, dateKey, fallbackEntries = [] } = {}) => {
  if (!override) return null;
  const fallback = Array.isArray(fallbackEntries) ? fallbackEntries : [];
  const count = integer(hasOwn(override, "refuels") ? override.refuels : fallback.length || (amount(override.cost) > 0 ? 1 : 0));
  if (count === 0) return [];

  const totalCost = roundMoney(hasOwn(override, "cost") ? override.cost : fallback.reduce((sum, entry) => sum + amount(entry?.cost), 0));
  const totalLiters = roundMoney(hasOwn(override, "liters") ? override.liters : fallback.reduce((sum, entry) => sum + amount(entry?.liters), 0));
  const fallbackCost = fallback.reduce((sum, entry) => sum + amount(entry?.cost), 0);
  const fallbackLiters = fallback.reduce((sum, entry) => sum + amount(entry?.liters), 0);

  const entries = Array.from({ length: count }, (_, index) => {
    const source = fallback[index] ?? {};
    const sourceCost = amount(source.cost);
    const sourceLiters = amount(source.liters);
    const cost = fallback.length === count && fallbackCost > 0
      ? totalCost * sourceCost / fallbackCost
      : totalCost / count;
    const liters = fallback.length === count && fallbackLiters > 0
      ? totalLiters * sourceLiters / fallbackLiters
      : totalLiters / count;
    return normalizeFuelEntry(source, dateKey, index, cost, liters);
  });

  // Splitting a corrected total between several visible rows can introduce a
  // cent of rounding drift. Put any remainder on the last row so the daily
  // editor, cards, and charts all add up to exactly the saved totals.
  const total = (key) => entries.reduce((sum, entry) => sum + amount(entry[key]), 0);
  const lastIndex = entries.length - 1;
  entries[lastIndex].cost = roundMoney(entries[lastIndex].cost + (totalCost - total("cost")));
  entries[lastIndex].liters = roundMoney(entries[lastIndex].liters + (totalLiters - total("liters")));
  return entries;
};

const samePlate = (left, right) => String(left ?? "").replace(/\s+/g, "").toLocaleUpperCase("es") === String(right ?? "").replace(/\s+/g, "").toLocaleUpperCase("es");
const inPeriod = (dateKey, month, year) => {
  const value = String(dateKey ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return date.getFullYear() === year && date.getMonth() === month;
};

/**
 * Builds the fuel rows shown for one driver and period. A saved daily
 * override replaces the values/count for that day while untouched transaction
 * rows remain intact. This projection is shared by Conductores summaries so a
 * correction never updates the calendar but leaves the monthly total stale.
 */
export const getDriverFuelEntriesForPeriod = ({ driverId, vehiclePlate, month, year, driverEntries = [], transactions = [] } = {}) => {
  const byDate = new Map();
  (transactions ?? [])
    .filter((transaction) => transaction?.type === "fuel" && transaction?.driver_id === driverId && samePlate(transaction?.vehicle_plate, vehiclePlate) && inPeriod(transaction?.occurred_on, month, year))
    .forEach((transaction) => {
      const dateKey = String(transaction.occurred_on);
      const entry = {
        id: transaction.id,
        transactionId: transaction.id,
        sourceDocumentId: transaction.source_document_id,
        date: dateKey,
        time: transaction.metadata?.time || "",
        liters: amount(transaction.metadata?.liters),
        cost: amount(transaction.amount),
      };
      byDate.set(dateKey, [...(byDate.get(dateKey) ?? []), entry]);
    });

  (driverEntries ?? [])
    .filter((entry) => entry?.driver_id === driverId && samePlate(entry?.vehicle_plate, vehiclePlate) && inPeriod(entry?.entry_date, month, year))
    .forEach((entry) => {
      const dateKey = String(entry.entry_date);
      const override = getDriverDayOverride(entry, "fuel");
      const fallback = byDate.get(dateKey) ?? [];
      if (override) {
        byDate.set(dateKey, buildDriverFuelOverrideEntries({ override, dateKey, fallbackEntries: fallback }) ?? fallback);
        return;
      }
      if (!byDate.has(dateKey) && (amount(entry.fuel_cost) > 0 || amount(entry.fuel_liters) > 0)) {
        byDate.set(dateKey, [{
          id: entry.id,
          date: dateKey,
          time: "",
          liters: amount(entry.fuel_liters),
          cost: amount(entry.fuel_cost),
        }]);
      }
    });

  return [...byDate.values()].flat().sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
};

export const getDriverMileageOverride = (entry) => getDriverDayOverride(entry, "mileage");

export const buildDriverMileageOverride = ({ dailyKm = 0, odometerKm = 0 } = {}) => ({
  dailyKm: amount(dailyKm),
  odometerKm: integer(odometerKm),
});

export const parseDriverDayNumber = toNumber;
