export const instrumentClusterVehiclePlate = "5754 MJV";
export const instrumentClusterBaselineKm = 174900;
export const realOdometerBaselineKm = 486900;
export const instrumentClusterOffsetKm = realOdometerBaselineKm - instrumentClusterBaselineKm;
export const initialNextServiceInstrumentKm = 223143;
export const oilServiceIntervalKm = 25000;
export const instrumentClusterInstalledOn = "2025-08-21";

export const instrumentClusterTrackingConfigs = {
  "5043 MLC": { instrumentBaselineKm: 108987, realBaselineKm: 528837, lastServiceRealKm: 541730, initialRemainingKm: oilServiceIntervalKm, installedOn: "2026-09-29" },
  "5754 MJV": { instrumentBaselineKm: instrumentClusterBaselineKm, realBaselineKm: realOdometerBaselineKm, lastServiceRealKm: 510143, initialRemainingKm: oilServiceIntervalKm, installedOn: instrumentClusterInstalledOn },
  "5750 MJV": { instrumentBaselineKm: 5843, realBaselineKm: 554774, lastServiceRealKm: 575169, initialRemainingKm: oilServiceIntervalKm, installedOn: "2026-09-29" },
};

const normalizePlate = (value) => {
  const compact = String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^(\d{4})([A-Z]{3})$/);
  return match ? `${match[1]} ${match[2]}` : String(value ?? "").trim().toUpperCase();
};

const asPositiveKm = (value) => {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

const getTrackingConfig = (vehiclePlate = instrumentClusterVehiclePlate) => {
  const plate = normalizePlate(vehiclePlate);
  const config = instrumentClusterTrackingConfigs[plate];
  if (config) return { ...config, plate, lastServiceInstrumentKm: config.lastServiceRealKm - (config.realBaselineKm - config.instrumentBaselineKm) };
  if (["0344 LCP", "9401 LTG"].includes(plate)) return { plate, instrumentBaselineKm: 0, realBaselineKm: 0, installedOn: "", initialRemainingKm: 0 };
  return null;
};

export const isInstrumentClusterVehicle = (vehiclePlate) => Boolean(instrumentClusterTrackingConfigs[normalizePlate(vehiclePlate)]);

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
  return /\b(mantenimiento|revision|aceite|filtros?)\b/.test(description);
};

const getServiceTarget = (documents, vehiclePlate) => {
  const config = getTrackingConfig(vehiclePlate);
  if (!config) return { target: 0, anchor: 0 };
  const resets = documents
    .filter((document) => normalizePlate(document?.vehicle_plate ?? documentFields(document).vehicle) === config.plate)
    .map((document) => {
      const fields = documentFields(document);
      const rawAnchor = asPositiveKm(fields.serviceResetInstrumentKm);
      const anchor = fields.serviceCounterVersion === 2 ? rawAnchor : getServiceInvoiceInstrumentKm(rawAnchor, config.plate);
      return { fields, anchor, target: asPositiveKm(fields.nextServiceInstrumentKm) - rawAnchor + anchor, date: documentDate(document), savedAt: String(document.created_at ?? "") };
    })
    .filter(({ fields, anchor, target }) => fields.serviceCounterReset === true && anchor > 0 && target >= anchor && anchor >= (config.lastServiceInstrumentKm ?? 0))
    .sort((left, right) => right.date.localeCompare(left.date) || right.savedAt.localeCompare(left.savedAt));
  const reset = resets[0];
  const anchor = reset?.anchor ?? config.lastServiceInstrumentKm ?? config.instrumentBaselineKm;
  return { anchor, target: reset?.target ?? anchor + config.initialRemainingKm };
};

export const getNextServiceInstrumentKm = (documents = [], vehiclePlate = instrumentClusterVehiclePlate) => getServiceTarget(documents, vehiclePlate).target;

export const buildInstrumentClusterTracking = ({ entries = [], documents = [], vehiclePlate = instrumentClusterVehiclePlate } = {}) => {
  const config = getTrackingConfig(vehiclePlate);
  if (!config) return null;
  const instrumentKm = getLatestInstrumentClusterKm(entries, config.plate, documents);
  const { target: nextServiceInstrumentKm, anchor } = getServiceTarget(documents, config.plate);
  return {
    instrumentKm: instrumentKm || null,
    realKm: isInstrumentClusterVehicle(config.plate) ? config.realBaselineKm + (instrumentKm - config.instrumentBaselineKm) : null,
    nextServiceInstrumentKm,
    serviceAnchorKm: anchor,
    remainingKm: nextServiceInstrumentKm ? Math.max(0, nextServiceInstrumentKm - Math.max(instrumentKm, anchor)) : null,
  };
};

export const getServiceInvoiceInstrumentKm = (value, plate) => {
  const reading = asPositiveKm(value);
  const config = getTrackingConfig(plate);
  const offset = (config?.realBaselineKm ?? 0) - (config?.instrumentBaselineKm ?? 0);
  return offset > 0 && reading >= config.realBaselineKm ? reading - offset : reading;
};

export const buildServiceCounterResetMetadata = ({ instrumentKm, vehiclePlate = instrumentClusterVehiclePlate, intervalKm = oilServiceIntervalKm } = {}) => {
  const config = getTrackingConfig(vehiclePlate);
  const currentInstrumentKm = asPositiveKm(instrumentKm) || config?.lastServiceInstrumentKm || config?.instrumentBaselineKm || 0;
  return {
    serviceCounterReset: true,
    serviceCounterVersion: 2,
    serviceIntervalKm: Math.max(0, Math.round(Number(intervalKm) || 0)),
    serviceResetInstrumentKm: currentInstrumentKm,
    nextServiceInstrumentKm: currentInstrumentKm + Math.max(0, Math.round(Number(intervalKm) || 0)),
  };
};
