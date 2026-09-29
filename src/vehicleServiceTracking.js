export const instrumentClusterVehiclePlate = "5754 MJV";
export const instrumentClusterBaselineKm = 174900;
export const realOdometerBaselineKm = 486900;
export const instrumentClusterOffsetKm = realOdometerBaselineKm - instrumentClusterBaselineKm;
export const initialNextServiceInstrumentKm = 199900;
export const oilServiceIntervalKm = 25000;
export const instrumentClusterInstalledOn = "2025-08-21";

export const instrumentClusterTrackingConfigs = {
  "5043 MLC": { instrumentBaselineKm: 108987, realBaselineKm: 528837, lastServiceInstrumentKm: 98749, initialRemainingKm: oilServiceIntervalKm, installedOn: "2026-09-29" },
  "5754 MJV": { instrumentBaselineKm: instrumentClusterBaselineKm, realBaselineKm: realOdometerBaselineKm, initialRemainingKm: 25000, installedOn: instrumentClusterInstalledOn },
  "5750 MJV": { instrumentBaselineKm: 5843, realBaselineKm: 554774, lastServiceInstrumentKm: 2850, initialRemainingKm: oilServiceIntervalKm, installedOn: "2026-09-29" },
};

const normalizePlate = (value) => {
  const compact = String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^(\d{4})([A-Z]{3})$/);
  return match ? `${match[1]} ${match[2]}` : String(value ?? "").trim().toUpperCase();
};

const asPositiveKm = (value) => {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

const getTrackingConfig = (vehiclePlate = instrumentClusterVehiclePlate) => {
  const plate = normalizePlate(vehiclePlate);
  const config = instrumentClusterTrackingConfigs[plate];
  return config ? { ...config, plate } : null;
};

export const isInstrumentClusterVehicle = (vehiclePlate) => Boolean(getTrackingConfig(vehiclePlate));

const entryOdometerKm = (entry) => {
  const overrides = typeof entry?.manual_overrides === "string"
    ? (() => { try { return JSON.parse(entry.manual_overrides); } catch { return {}; } })()
    : entry?.manual_overrides ?? {};
  return asPositiveKm(overrides?.mileage?.odometerKm) || asPositiveKm(entry?.odometer_km);
};

const documentFields = (document) => document?.extracted_data ?? document?.extractedData ?? document?.fields ?? {};
const normalizeText = (value) => String(value ?? "").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const accumulatedMileageRecordTypes = new Set(["total-km", "total", "odometer", "odometro", "kilometraje total", "km acumulados"]);

const documentOdometerKm = (document) => {
  const fields = documentFields(document);
  const recordType = normalizeText(fields.recordType ?? fields.record_type);
  if (!accumulatedMileageRecordTypes.has(recordType)) return 0;
  return asPositiveKm(fields.odometerKm ?? fields.odometer_km ?? fields.totalKm ?? fields.kilometres ?? fields.kilometers ?? fields.km);
};

const documentDate = (document) => String(document?.document_date ?? documentFields(document).date ?? document?.created_at ?? "").slice(0, 10);

export const getLatestInstrumentClusterKm = (entries = [], vehiclePlate = instrumentClusterVehiclePlate, documents = []) => {
  const config = getTrackingConfig(vehiclePlate);
  if (!config) return 0;
  const latestEntryKm = entries.reduce((latest, entry) => {
    if (normalizePlate(entry?.vehicle_plate) !== config.plate) return latest;
    if (String(entry?.entry_date ?? "") < config.installedOn) return latest;
    return Math.max(latest, entryOdometerKm(entry));
  }, config.instrumentBaselineKm);
  return documents.reduce((latest, document) => {
    const fields = documentFields(document);
    if (normalizePlate(document?.vehicle_plate ?? fields.vehicle ?? fields.vehiclePlate) !== config.plate) return latest;
    if (documentDate(document) < config.installedOn) return latest;
    return Math.max(latest, documentOdometerKm(document));
  }, latestEntryKm);
};

export const isOilAndFilterMaintenance = ({ recordType, fields = {} } = {}) => {
  if (normalizeText(recordType) !== "maintenance") return false;
  const itemText = Array.isArray(fields.maintenanceItems)
    ? fields.maintenanceItems.map((item) => typeof item === "string" ? item : item?.description ?? item?.concept).join(" ")
    : "";
  const description = normalizeText(`${fields.concept ?? ""} ${fields.expenseCategory ?? ""} ${itemText}`);
  return description.includes("aceite") && description.includes("filtro");
};

export const getNextServiceInstrumentKm = (documents = [], vehiclePlate = instrumentClusterVehiclePlate) => {
  const config = getTrackingConfig(vehiclePlate);
  if (!config) return 0;
  const resets = documents
    .filter((document) => normalizePlate(document?.vehicle_plate ?? documentFields(document).vehicle) === config.plate)
    .map((document) => ({ fields: documentFields(document), date: String(document?.document_date ?? document?.created_at ?? "") }))
    .filter(({ fields }) => fields.serviceCounterReset === true)
    .sort((left, right) => right.date.localeCompare(left.date));
  const latestTarget = asPositiveKm(resets[0]?.fields?.nextServiceInstrumentKm);
  return latestTarget || (config.lastServiceInstrumentKm ?? config.instrumentBaselineKm) + config.initialRemainingKm;
};

export const buildInstrumentClusterTracking = ({ entries = [], documents = [], vehiclePlate = instrumentClusterVehiclePlate } = {}) => {
  const config = getTrackingConfig(vehiclePlate);
  if (!config) return null;
  const instrumentKm = getLatestInstrumentClusterKm(entries, config.plate, documents);
  const nextServiceInstrumentKm = getNextServiceInstrumentKm(documents, config.plate);
  return {
    instrumentKm,
    realKm: config.realBaselineKm + (instrumentKm - config.instrumentBaselineKm),
    nextServiceInstrumentKm,
    remainingKm: Math.max(0, nextServiceInstrumentKm - instrumentKm),
  };
};

export const buildServiceCounterResetMetadata = ({ instrumentKm, vehiclePlate = instrumentClusterVehiclePlate } = {}) => {
  const config = getTrackingConfig(vehiclePlate);
  const currentInstrumentKm = asPositiveKm(instrumentKm) || config?.instrumentBaselineKm || instrumentClusterBaselineKm;
  return {
    serviceCounterReset: true,
    serviceIntervalKm: oilServiceIntervalKm,
    serviceResetInstrumentKm: currentInstrumentKm,
    nextServiceInstrumentKm: currentInstrumentKm + oilServiceIntervalKm,
  };
};
