const normalized = (value) => String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const timestamp = (row) => Date.parse(row?.updated_at || row?.updatedAt || row?.created_at || "") || 0;

export function resolveMonthlyPayroll({ driverId, driver, plate, periodStart, financials = [], overrides = [], fallback = 0 }) {
  const period = new Date(`${periodStart}T12:00:00Z`);
  const periodKey = `${period.getUTCFullYear()}-${period.getUTCMonth()}`;
  const stored = financials.find((row) => driverId && row.driver_id === driverId && row.period_start === periodStart);
  const override = overrides.filter((row) => (row.expense_key ?? row.expenseKey) === "payroll"
    && (row.period_key ?? row.periodKey) === periodKey
    && (!plate || (row.vehicle_plate ?? row.plate) === plate)
    && (driverId ? (row.breakdown_key ?? row.breakdownKey) === driverId || normalized(row.driver_label ?? row.driverLabel) === normalized(driver) : normalized(row.driver_label ?? row.driverLabel) === normalized(driver)))
    .sort((a, b) => timestamp(b) - timestamp(a))[0];
  const value = override && (!stored || timestamp(override) > timestamp(stored)) ? override.amount : stored?.payroll ?? override?.amount ?? fallback;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}
