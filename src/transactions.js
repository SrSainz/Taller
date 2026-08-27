import { canonicalizeVehiclePlate } from "./data/vehicleRegistry.js";
import { getDriverBillingAmounts } from "./documentAnalysis.js";

const parseNumeric = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").replace(/[^\d,.-]/g, "").trim();
  if (!raw) return 0;
  const normalized = raw.includes(",") && raw.includes(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};
const money = (value) => Math.max(0, parseNumeric(value));
const isoDate = (value, fallback = "") => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) ? String(value) : fallback;
const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase("es");
const fieldValue = (value) => value && typeof value === "object" && "value" in value ? value.value : value;
const normalizedFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fieldValue(value)]));

export const hashDocumentFile = async (file) => {
  if (!file?.arrayBuffer || !globalThis.crypto?.subtle) return "";
  try {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    // Hashing improves duplicate detection but must never prevent an already
    // validated file from being archived when a browser lacks a usable
    // crypto implementation or the read fails transiently.
    return "";
  }
};

export const buildDedupeKey = ({ fileHash, type, date, amount, driverId, vehiclePlate, sourceIdentity = "" }) =>
  [fileHash || "nohash", type, date, money(amount).toFixed(2), driverId || "", normalized(canonicalizeVehiclePlate(vehiclePlate)).replace(/\s+/g, ""), normalized(sourceIdentity).replace(/\s+/g, "")].join(":");

export const operationsFromDocument = ({ category, fields = {}, recordType = "", driverId = "", vehiclePlate = "", fileHash = "", fallbackDate = "" }) => {
  const values = normalizedFields(fields);
  const normalizedRecordType = normalized(recordType || values.recordType);
  const isDriverBilling = category === "billing" && ["billing", "billing_daily"].includes(normalizedRecordType);
  const firstPresent = (...keys) => keys.map((key) => values[key]).find((value) => value !== null && value !== undefined && String(value).trim() !== "");
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
  const driverBillingAmounts = isDriverBilling ? getDriverBillingAmounts(values) : null;
  const primaryAmount = isDriverBilling
    ? driverBillingAmounts.netAmount || firstPresent("total", "amount")
    : firstPresent("total", "netAmount", "amount");
  const driverBillingMetadata = isDriverBilling ? {
    recordType: normalizedRecordType,
    connection: values.connection || "",
    trips: money(values.trips),
    points: money(values.points),
    baseNetAmount: driverBillingAmounts.baseNetAmount,
    netAmount: driverBillingAmounts.netAmount,
    promotions: driverBillingAmounts.promotions,
    earningsTotal: money(values.total || values.earningsTotal) || Number((driverBillingAmounts.netAmount + money(values.tips)).toFixed(2)),
    refunds: money(values.refunds || values.reimbursements),
    tips: money(values.tips),
    cashCollected: parseNumeric(values.cashCollected),
  } : {};
  return [
    operation(primaryType, primaryAmount, { category: isMaintenanceDocument ? "taller" : "billing", ...driverBillingMetadata }),
    operation("cash", values.cashCollected, { category: "cash" }),
    operation("tip", values.tips, { category: "tip" }),
    operation("toll", values.tolls, { category: "toll" }),
    operation("refund", values.refunds || values.reimbursements, { category: "refund" }),
    operation("wash", values.washExpenses, { category: "wash" }),
    operation("miscellaneous", values.otherExpenses, { category: "miscellaneous" }),
  ].filter(Boolean);
};

export const transactionsToDriverEntries = (transactions = []) => {
  const rows = new Map();
  const fieldByType = {
    billing: "billing",
    cash: "cash_collected",
    tip: "tips",
    toll: "tolls",
    refund: "refunds",
    wash: "wash_expenses",
    miscellaneous: "other_expenses",
  };
  transactions.forEach((transaction) => {
    if (!transaction.driver_id || !transaction.occurred_on) return;
    const key = `${transaction.driver_id}:${transaction.occurred_on}`;
    const row = rows.get(key) ?? (() => {
      const next = { id: key, driver_id: transaction.driver_id, vehicle_plate: canonicalizeVehiclePlate(transaction.vehicle_plate), entry_date: transaction.occurred_on, billing: 0, cash_collected: 0, tips: 0, fuel_cost: 0, fuel_liters: 0, odometer_km: 0, tolls: 0, refunds: 0, wash_expenses: 0, other_expenses: 0 };
      Object.defineProperty(next, "_centralFields", { value: new Set(), enumerable: false, writable: false });
      return next;
    })();
    const amount = money(transaction.amount);
    const field = fieldByType[transaction.type];
    if (field) {
      row[field] += amount;
      row._centralFields.add(field);
    }
    if (transaction.type === "fuel") {
      row.fuel_cost += amount;
      row._centralFields.add("fuel_cost");
      if (Object.hasOwn(transaction.metadata ?? {}, "liters")) {
        row.fuel_liters += money(transaction.metadata?.liters);
        row._centralFields.add("fuel_liters");
      }
    }
    if (Object.hasOwn(transaction.metadata ?? {}, "odometerKm")) {
      row.odometer_km = Math.max(row.odometer_km, money(transaction.metadata?.odometerKm));
      row._centralFields.add("odometer_km");
    }
    rows.set(key, row);
  });
  return [...rows.values()].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
};

const driverEntryAmountKeys = ["billing", "cash_collected", "tips", "fuel_cost", "fuel_liters", "odometer_km", "tolls", "refunds", "wash_expenses", "other_expenses"];

export const mergeDriverEntries = (legacyEntries = [], centralEntries = []) => {
  const rows = new Map((legacyEntries ?? [])
    .filter((entry) => entry?.driver_id && entry?.entry_date)
    .map((entry) => [`${entry.driver_id}:${entry.entry_date}`, { ...entry, vehicle_plate: canonicalizeVehiclePlate(entry.vehicle_plate) }]));
  (centralEntries ?? []).forEach((centralEntry) => {
    if (!centralEntry?.driver_id || !centralEntry?.entry_date) return;
    const key = `${centralEntry.driver_id}:${centralEntry.entry_date}`;
    const legacyEntry = rows.get(key) ?? {};
    const merged = { ...legacyEntry, ...centralEntry, vehicle_plate: canonicalizeVehiclePlate(centralEntry.vehicle_plate || legacyEntry.vehicle_plate) };
    const centralFields = centralEntry._centralFields instanceof Set ? centralEntry._centralFields : null;
    driverEntryAmountKeys.forEach((field) => {
      const centralValue = money(centralEntry[field]);
      const legacyValue = money(legacyEntry[field]);
      if (centralFields && !centralFields.has(field)) {
        merged[field] = legacyValue;
        return;
      }
      if (centralFields?.has(field)) {
        merged[field] = centralValue;
        return;
      }
      merged[field] = field === "odometer_km"
        ? Math.max(centralValue, legacyValue)
        : (centralValue > 0 ? centralValue : legacyValue);
    });
    rows.set(key, merged);
  });
  return [...rows.values()].sort((left, right) => String(right.entry_date).localeCompare(String(left.entry_date)));
};
