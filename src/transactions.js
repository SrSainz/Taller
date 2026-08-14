const money = (value) => Math.max(0, Number(value) || 0);
const isoDate = (value, fallback = "") => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) ? String(value) : fallback;
const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase("es");

export const hashDocumentFile = async (file) => {
  if (!file?.arrayBuffer || !globalThis.crypto?.subtle) return "";
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const buildDedupeKey = ({ fileHash, type, date, amount, driverId, vehiclePlate }) =>
  [fileHash || "nohash", type, date, money(amount).toFixed(2), driverId || "", normalized(vehiclePlate).replace(/\s+/g, "")].join(":");

export const operationsFromDocument = ({ category, fields = {}, driverId = "", vehiclePlate = "", fileHash = "", fallbackDate = "" }) => {
  const date = category === "billing"
    ? isoDate(fields.serviceDate || fields.issueDate || fields.date, fallbackDate)
    : isoDate(fields.date || fields.serviceDate || fields.issueDate, fallbackDate);
  if (!date) return [];
  const plate = String(fields.vehicle || vehiclePlate || "").toUpperCase().trim();
  const operation = (type, amount, metadata = {}) => money(amount) > 0 ? {
    type, date, amount: money(amount), driverId: driverId || "", vehiclePlate: plate,
    category: type, metadata,
    dedupeKey: buildDedupeKey({ fileHash, type, date, amount, driverId, vehiclePlate: plate }),
  } : null;

  if (category === "consumption") {
    return [operation("fuel", fields.cost, { liters: money(fields.consumption), unit: fields.unit || "", costPerUnit: money(fields.costPerUnit), odometerKm: money(fields.odometerKm) })].filter(Boolean);
  }

  const expense = normalized(fields.expenseCategory || fields.concept);
  const primaryType = expense.includes("taller") || expense.includes("manten") ? "maintenance" : "billing";
  return [
    operation(primaryType, fields.total || fields.netAmount, { company: fields.company || "", invoiceNumber: fields.invoiceNumber || "", concept: fields.concept || "" }),
    operation("cash", fields.cashCollected),
    operation("tip", fields.tips),
    operation("toll", fields.tolls),
    operation("wash", fields.washExpenses),
    operation("miscellaneous", fields.otherExpenses),
  ].filter(Boolean);
};

export const transactionsToDriverEntries = (transactions = []) => {
  const rows = new Map();
  transactions.forEach((transaction) => {
    if (!transaction.driver_id || !transaction.occurred_on) return;
    const key = `${transaction.driver_id}:${transaction.occurred_on}`;
    const row = rows.get(key) ?? { id: key, driver_id: transaction.driver_id, vehicle_plate: transaction.vehicle_plate || "", entry_date: transaction.occurred_on, billing: 0, cash_collected: 0, tips: 0, fuel_cost: 0, fuel_liters: 0, odometer_km: 0, tolls: 0, wash_expenses: 0, other_expenses: 0 };
    const amount = money(transaction.amount);
    if (transaction.type === "billing") row.billing += amount;
    if (transaction.type === "cash") row.cash_collected += amount;
    if (transaction.type === "tip") row.tips += amount;
    if (transaction.type === "fuel") { row.fuel_cost += amount; row.fuel_liters = Math.max(row.fuel_liters, money(transaction.metadata?.liters)); }
    if (transaction.type === "toll") row.tolls += amount;
    if (transaction.type === "wash") row.wash_expenses += amount;
    if (transaction.type === "miscellaneous") row.other_expenses += amount;
    row.odometer_km = Math.max(row.odometer_km, money(transaction.metadata?.odometerKm));
    rows.set(key, row);
  });
  return [...rows.values()].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
};
