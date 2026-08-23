import { canonicalizeVehiclePlate } from "./data/vehicleRegistry.js";

const money = (value) => Math.max(0, Number(value) || 0);
const isoDate = (value, fallback = "") => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) ? String(value) : fallback;
const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase("es");
const fieldValue = (value) => value && typeof value === "object" && "value" in value ? value.value : value;
const normalizedFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fieldValue(value)]));

export const hashDocumentFile = async (file) => {
  if (!file?.arrayBuffer || !globalThis.crypto?.subtle) return "";
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const buildDedupeKey = ({ fileHash, type, date, amount, driverId, vehiclePlate, sourceIdentity = "" }) =>
  [fileHash || "nohash", type, date, money(amount).toFixed(2), driverId || "", normalized(canonicalizeVehiclePlate(vehiclePlate)).replace(/\s+/g, ""), normalized(sourceIdentity).replace(/\s+/g, "")].join(":");

export const operationsFromDocument = ({ category, fields = {}, driverId = "", vehiclePlate = "", fileHash = "", fallbackDate = "" }) => {
  const values = normalizedFields(fields);
  const date = category === "billing"
    ? isoDate(values.serviceDate || values.issueDate || values.date || values.periodStart, fallbackDate)
    : isoDate(values.date || values.serviceDate || values.issueDate, fallbackDate);
  if (!date) return [];
  const plate = canonicalizeVehiclePlate(values.vehicle || vehiclePlate);
  const sourceIdentity = values.invoiceNumber || values.ticketNumber || values.reference || [values.company, values.provider, values.gasStation, values.concept, values.expenseCategory].filter(Boolean).join("|");
  const documentText = normalized([values.supplyType, values.fuelType, values.concept, values.expenseCategory, values.documentType].filter(Boolean).join(" "));
  const isFuelDocument = category === "consumption" || /gasolin|diesel|di[eé]sel|gas[oó]leo|combustible|repostaje|estaci[oó]n de servicio/.test(documentText);
  const isMaintenanceDocument = /taller|manten|repar|aceite|neum[aá]tic|filtro|revisi[oó]n|aver[ií]a|mec[aá]nic|chapa|pintura|itv/.test(documentText);
  const metadataBase = {
    company: values.company || values.provider || values.gasStation || "",
    invoiceNumber: values.invoiceNumber || values.ticketNumber || "",
    ticketNumber: values.ticketNumber || values.invoiceNumber || "",
    time: values.time || "",
    documentType: values.documentType || "",
    concept: values.concept || "",
    expenseCategory: values.expenseCategory || "",
    supplyType: values.supplyType || values.fuelType || "",
  };
  const operation = (type, amount, metadata = {}) => money(amount) > 0 ? {
    type, date, amount: money(amount), driverId: driverId || "", vehiclePlate: plate,
    category: metadata.category || type, metadata: { ...metadataBase, ...metadata },
    dedupeKey: buildDedupeKey({ fileHash, type, date, amount, driverId, vehiclePlate: plate, sourceIdentity }),
  } : null;

  if (isFuelDocument) {
    return [operation("fuel", values.cost || values.total || values.amount, {
      category: "gasolina",
      liters: money(values.consumption || values.liters),
      unit: values.unit || "",
      costPerUnit: money(values.costPerUnit || values.pricePerLiter),
      odometerKm: money(values.odometerKm),
      fuelType: values.fuelType || values.supplyType || "",
      provider: values.provider || values.gasStation || values.company || "",
    })].filter(Boolean);
  }
  const primaryType = isMaintenanceDocument ? "maintenance" : "billing";
  return [
    operation(primaryType, values.total || values.netAmount || values.amount, { category: isMaintenanceDocument ? "taller" : "billing" }),
    operation("cash", values.cashCollected, { category: "cash" }),
    operation("tip", values.tips, { category: "tip" }),
    operation("toll", values.tolls, { category: "toll" }),
    operation("wash", values.washExpenses, { category: "wash" }),
    operation("miscellaneous", values.otherExpenses, { category: "miscellaneous" }),
  ].filter(Boolean);
};

export const transactionsToDriverEntries = (transactions = []) => {
  const rows = new Map();
  transactions.forEach((transaction) => {
    if (!transaction.driver_id || !transaction.occurred_on) return;
    const key = `${transaction.driver_id}:${transaction.occurred_on}`;
    const row = rows.get(key) ?? { id: key, driver_id: transaction.driver_id, vehicle_plate: canonicalizeVehiclePlate(transaction.vehicle_plate), entry_date: transaction.occurred_on, billing: 0, cash_collected: 0, tips: 0, fuel_cost: 0, fuel_liters: 0, odometer_km: 0, tolls: 0, wash_expenses: 0, other_expenses: 0 };
    const amount = money(transaction.amount);
    if (transaction.type === "billing") row.billing += amount;
    if (transaction.type === "cash") row.cash_collected += amount;
    if (transaction.type === "tip") row.tips += amount;
    if (transaction.type === "fuel") { row.fuel_cost += amount; row.fuel_liters += money(transaction.metadata?.liters); }
    if (transaction.type === "toll") row.tolls += amount;
    if (transaction.type === "wash") row.wash_expenses += amount;
    if (transaction.type === "miscellaneous") row.other_expenses += amount;
    row.odometer_km = Math.max(row.odometer_km, money(transaction.metadata?.odometerKm));
    rows.set(key, row);
  });
  return [...rows.values()].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
};

const driverEntryAmountKeys = ["billing", "cash_collected", "tips", "fuel_cost", "fuel_liters", "odometer_km", "tolls", "wash_expenses", "other_expenses"];

export const mergeDriverEntries = (legacyEntries = [], centralEntries = []) => {
  const rows = new Map((legacyEntries ?? [])
    .filter((entry) => entry?.driver_id && entry?.entry_date)
    .map((entry) => [`${entry.driver_id}:${entry.entry_date}`, { ...entry, vehicle_plate: canonicalizeVehiclePlate(entry.vehicle_plate) }]));
  (centralEntries ?? []).forEach((centralEntry) => {
    if (!centralEntry?.driver_id || !centralEntry?.entry_date) return;
    const key = `${centralEntry.driver_id}:${centralEntry.entry_date}`;
    const legacyEntry = rows.get(key) ?? {};
    const merged = { ...legacyEntry, ...centralEntry, vehicle_plate: canonicalizeVehiclePlate(centralEntry.vehicle_plate || legacyEntry.vehicle_plate) };
    driverEntryAmountKeys.forEach((field) => {
      const centralValue = money(centralEntry[field]);
      const legacyValue = money(legacyEntry[field]);
      merged[field] = field === "odometer_km"
        ? Math.max(centralValue, legacyValue)
        : (centralValue > 0 ? centralValue : legacyValue);
    });
    rows.set(key, merged);
  });
  return [...rows.values()].sort((left, right) => String(right.entry_date).localeCompare(String(left.entry_date)));
};
