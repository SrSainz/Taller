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
  const note = (value) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  return {
    instrumentKm: normalizeKm(values.instrumentKm), realKm: normalizeKm(values.realKm), remainingKm: normalizeKm(values.remainingKm),
    trackingInstrumentKm: normalizeKm(values.trackingInstrumentKm), trackingServiceTargetKm: normalizeKm(values.trackingServiceTargetKm),
    waterPump: plate === "9401 LTG" ? "" : note(values.waterPump),
    timingBelt: plate === "9401 LTG" ? note(values.timingBelt) : "",
    sparkPlugs: note(values.sparkPlugs), itvDate,
  };
};

export const resolveMaintenanceVehicleDetails = (vehicle, values = {}) => {
  const details = normalizeMaintenanceVehicleDetails(vehicle.plate, values) ?? {};
  const tracking = vehicle.serviceTracking ?? {};
  const distance = details.trackingInstrumentKm != null && tracking.instrumentKm != null
    ? Math.max(0, tracking.instrumentKm - details.trackingInstrumentKm) : 0;
  const serviceWasReset = details.trackingServiceTargetKm != null && tracking.nextServiceInstrumentKm != null
    && details.trackingServiceTargetKm !== tracking.nextServiceInstrumentKm;
  return {
    ...details,
    instrumentKm: details.instrumentKm != null ? details.instrumentKm + distance : tracking.instrumentKm ?? null,
    realKm: details.realKm != null ? details.realKm + distance : tracking.realKm ?? null,
    remainingKm: details.remainingKm != null && !serviceWasReset ? Math.max(0, details.remainingKm - distance) : tracking.remainingKm ?? null,
  };
};

export const normalizeMaintenanceVehicleDetailsMap = (stored = {}) => Object.fromEntries(
  Object.entries(stored ?? {}).map(([plate, values]) => [plate, normalizeMaintenanceVehicleDetails(plate, values)]).filter(([, values]) => values),
);

export const formatMaintenanceItvDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))
  ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
  : "—";
