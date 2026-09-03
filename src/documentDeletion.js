const normalizeText = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const documentData = (document) => document?.extracted_data ?? {};

const documentFields = (document) => {
  const data = documentData(document);
  return data.fields && typeof data.fields === "object" ? data.fields : data;
};

const fieldValue = (document, ...keys) => {
  const data = documentData(document);
  const fields = documentFields(document);
  for (const key of keys) {
    const candidate = data[key] ?? fields[key];
    const value = candidate && typeof candidate === "object" && "value" in candidate ? candidate.value : candidate;
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return "";
};

const documentDate = (document) => {
  const raw = document?.document_date
    ?? fieldValue(document, "accountingDate", "date", "entryDate", "invoiceDate", "serviceDate", "documentDate", "fecha");
  const value = String(raw ?? "").trim();
  const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const european = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  return european ? `${european[3]}-${String(european[2]).padStart(2, "0")}-${String(european[1]).padStart(2, "0")}` : "";
};

const numericField = (document, ...keys) => {
  const value = Number(String(fieldValue(document, ...keys)).replace(",", "."));
  return Number.isFinite(value) ? value : 0;
};

const rawRecordType = (document) => normalizeText(fieldValue(document, "recordType", "metric"));

export const getDocumentDeletionKind = (document) => {
  const recordType = rawRecordType(document);
  if (document?.category === "billing" || recordType === "billing" || recordType === "billing_daily") return "billing";
  if (["daily-km", "partial-1", "total-km", "total", "odometer", "odometro", "kilometraje diario", "km diarios", "kilometraje total", "km acumulados"].includes(recordType)) return "mileage";
  if (["fuel", "fuel receipt", "fuel_receipt", "repostaje"].includes(recordType)) return "fuel";
  if (["consumption", "consumption rate", "consumo"].includes(recordType)) return "consumption";
  return document?.category === "consumption" ? "fuel" : "";
};

const documentMetricKey = (document) => {
  const recordType = rawRecordType(document);
  if (["daily-km", "partial-1", "kilometraje diario", "km diarios"].includes(recordType)) return "daily-km";
  if (["total-km", "total", "odometer", "odometro", "kilometraje total", "km acumulados"].includes(recordType)) return "total-km";
  if (recordType === "consumption" || recordType === "consumption rate" || recordType === "consumo") return "consumption";
  if (recordType === "billing" || recordType === "billing_daily" || document?.category === "billing") return "billing";
  if (recordType === "fuel" || recordType === "fuel receipt" || recordType === "fuel_receipt" || recordType === "repostaje" || document?.category === "consumption") return "fuel";
  return "";
};

const sameDocumentOwnerAndDate = (candidate, ownerId, dateKey) => {
  if (ownerId && String(candidate?.owner_id ?? candidate?.ownerId ?? "") !== String(ownerId)) return false;
  return !dateKey || documentDate(candidate) === dateKey;
};

const transactionDate = (transaction) => String(transaction?.occurred_on ?? transaction?.occurredOn ?? "");
const transactionOwner = (transaction) => transaction?.driver_id ?? transaction?.driverId ?? "";
const transactionSource = (transaction) => transaction?.source_document_id ?? transaction?.sourceDocumentId ?? "";
const transactionHasOdometer = (transaction) => {
  const value = transaction?.metadata?.odometerKm ?? transaction?.metadata?.odometer_km;
  return Number.isFinite(Number(value)) && Number(value) > 0;
};

const entryDate = (entry) => String(entry?.entry_date ?? entry?.entryDate ?? "");
const entryOwner = (entry) => entry?.driver_id ?? entry?.driverId ?? "";

/**
 * Removes a document from the in-memory collections used by both app modes.
 * The server-side RPC is authoritative in production; this helper keeps the
 * offline prototype and the UI optimistic state equally consistent.
 */
export const removeDocumentLocalData = ({ document, documents = [], transactions = [], entries = [], circleMetricValues = {} } = {}) => {
  const documentId = String(document?.id ?? "");
  const ownerId = document?.owner_id ?? document?.ownerId ?? "";
  const dateKey = documentDate(document);
  const kind = getDocumentDeletionKind(document);
  const metricKey = documentMetricKey(document);
  const nextDocuments = documents.filter((candidate) => String(candidate?.id ?? "") !== documentId);
  const nextTransactions = transactions.filter((candidate) => String(transactionSource(candidate)) !== documentId);
  const remainingDocuments = (candidateKind) => nextDocuments.some((candidate) => sameDocumentOwnerAndDate(candidate, ownerId, dateKey) && getDocumentDeletionKind(candidate) === candidateKind);
  const remainingMetricDocuments = (candidateMetric) => nextDocuments.some((candidate) => sameDocumentOwnerAndDate(candidate, ownerId, dateKey) && documentMetricKey(candidate) === candidateMetric);
  const remainingTransaction = (type) => nextTransactions.some((candidate) => String(transactionOwner(candidate)) === String(ownerId) && transactionDate(candidate) === dateKey && normalizeText(candidate?.type) === type);
  const remainingOdometerTransaction = nextTransactions.some((candidate) => String(transactionOwner(candidate)) === String(ownerId) && transactionDate(candidate) === dateKey && transactionHasOdometer(candidate));
  const hasRemainingOdometerSource = remainingMetricDocuments("daily-km") || remainingMetricDocuments("total-km") || nextDocuments.some((candidate) => sameDocumentOwnerAndDate(candidate, ownerId, dateKey) && ["fuel", "mileage"].includes(getDocumentDeletionKind(candidate)) && numericField(candidate, "odometerKm", "odometer_km", "totalKm") > 0) || remainingOdometerTransaction;

  const nextEntries = entries.map((entry) => {
    if (dateKey && entryDate(entry) !== dateKey) return entry;
    if (ownerId && entryOwner(entry) && String(entryOwner(entry)) !== String(ownerId)) return entry;
    const nextEntry = { ...entry };
    const manualOverrides = entry?.manual_overrides ?? entry?.manualOverrides ?? {};
    if (kind === "billing" && !remainingDocuments("billing") && !remainingTransaction("billing")) {
      nextEntry.billing = 0;
      nextEntry.cash_collected = 0;
      nextEntry.tips = 0;
      nextEntry.refunds = 0;
    }
    if (kind === "fuel" && !remainingDocuments("fuel") && !remainingTransaction("fuel")) {
      nextEntry.fuel_cost = 0;
      nextEntry.fuel_liters = 0;
    }
    if ((kind === "fuel" || kind === "mileage") && !hasRemainingOdometerSource && !manualOverrides.mileage) nextEntry.odometer_km = 0;
    return nextEntry;
  });

  const nextCircleMetricValues = Object.fromEntries(Object.entries(circleMetricValues ?? {}).map(([key, value]) => [key, { ...(value ?? {}) }]));
  if (dateKey && metricKey && !remainingMetricDocuments(metricKey)) {
    const dayValues = nextCircleMetricValues[dateKey];
    if (dayValues) {
      const cleanedDayValues = { ...dayValues };
      if (metricKey === "daily-km") delete cleanedDayValues.dailyKm;
      if (metricKey === "total-km") delete cleanedDayValues.totalKm;
      if (metricKey === "consumption") {
        delete cleanedDayValues.consumption;
        delete cleanedDayValues.consumptionUnit;
      }
      if (Object.keys(cleanedDayValues).length > 0) nextCircleMetricValues[dateKey] = cleanedDayValues;
      else delete nextCircleMetricValues[dateKey];
    }
  }

  return { documents: nextDocuments, transactions: nextTransactions, entries: nextEntries, circleMetricValues: nextCircleMetricValues };
};
