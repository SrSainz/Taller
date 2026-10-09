export const maintenanceVehicleDetailsStorageKey = "sobre-ruedas:maintenance-vehicle-details:v1";

const professionalPlates = new Set(["5043 MLC", "5750 MJV", "5754 MJV"]);
const particularPlates = new Set(["0344 LCP", "9401 LTG"]);

const normalizeKm = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const km = Number(value);
  return Number.isFinite(km) && km >= 0 ? Math.round(km) : null;
};

export const normalizeMaintenanceVehicleDetails = (plate, values = {}) => {
  if (!professionalPlates.has(plate) && !particularPlates.has(plate)) return null;
  const itvDate = /^\d{4}-\d{2}-\d{2}$/.test(String(values.itvDate ?? "")) ? values.itvDate : "";
  return particularPlates.has(plate)
    ? { instrumentKm: normalizeKm(values.instrumentKm), remainingKm: normalizeKm(values.remainingKm), itvDate }
    : { itvDate };
};

export const normalizeMaintenanceVehicleDetailsMap = (stored = {}) => Object.fromEntries(
  Object.entries(stored ?? {}).map(([plate, values]) => [plate, normalizeMaintenanceVehicleDetails(plate, values)]).filter(([, values]) => values),
);

export const formatMaintenanceItvDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))
  ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
  : "—";
