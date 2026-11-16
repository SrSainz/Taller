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
    sparkPlugs: note(values.sparkPlugs),
    atfKm: professionalPlates.has(plate) ? normalizeKm(values.atfKm) : null,
    itvDate,
  };
};

export const resolveMaintenanceVehicleDetails = (vehicle, values = {}) => {
  const details = normalizeMaintenanceVehicleDetails(vehicle.plate, values) ?? {};
  const tracking = vehicle.serviceTracking ?? {};
  const distance = details.trackingInstrumentKm != null && tracking.instrumentKm != null
    ? Math.max(0, tracking.instrumentKm - details.trackingInstrumentKm) : 0;
  const serviceWasReset = tracking.nextServiceInstrumentKm > 0 && details.trackingServiceTargetKm !== tracking.nextServiceInstrumentKm;
  const instrumentKm = details.instrumentKm != null
    ? details.trackingInstrumentKm == null ? Math.max(details.instrumentKm, tracking.instrumentKm ?? 0) : details.instrumentKm + distance
    : tracking.instrumentKm ?? null;
  const realKm = details.realKm != null ? details.realKm + distance : tracking.realKm ?? null;
  const offset = tracking.realKm != null && tracking.instrumentKm != null ? tracking.realKm - tracking.instrumentKm : 0;
  const currentKm = details.realKm != null && tracking.realKm != null ? realKm - offset : instrumentKm;
  const remainingKm = tracking.nextServiceInstrumentKm > 0 && tracking.serviceAnchorKm != null
    ? Math.max(0, tracking.nextServiceInstrumentKm - Math.max(currentKm ?? 0, tracking.serviceAnchorKm))
    : tracking.remainingKm ?? null;
  return {
    ...details,
    instrumentKm,
    realKm,
    remainingKm: details.remainingKm != null && !serviceWasReset ? Math.max(0, details.remainingKm - distance) : remainingKm,
  };
};

export const normalizeMaintenanceVehicleDetailsMap = (stored = {}) => Object.fromEntries(
  Object.entries(stored ?? {}).map(([plate, values]) => [plate, normalizeMaintenanceVehicleDetails(plate, values)]).filter(([, values]) => values),
);

export const formatMaintenanceItvDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))
  ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
  : "—";
