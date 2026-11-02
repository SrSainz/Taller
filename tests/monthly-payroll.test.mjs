import test from "node:test";
import assert from "node:assert/strict";
import { resolveMonthlyPayroll } from "../src/monthlyPayroll.js";
import { calculateDriverCommission } from "../src/commissionReports.js";
const args = { driverId: "alex", driver: "Alex", plate: "5043 MLC", periodStart: "2026-10-01", fallback: 1323.72 };
const old = { expense_key: "payroll", period_key: "2026-9", vehicle_plate: "5043 MLC", breakdown_key: "alex", amount: 1400, updated_at: "2026-10-25T10:00:00Z" };
test("la corrección antigua se comparte y un guardado central posterior prevalece, incluido cero", () => {
  assert.equal(resolveMonthlyPayroll({ ...args, overrides: [old] }), 1400);
  assert.equal(resolveMonthlyPayroll({ ...args, overrides: [old], financials: [{ driver_id: "alex", period_start: args.periodStart, payroll: 0, updated_at: "2026-11-02T10:00:00Z" }] }), 0);
  assert.equal(resolveMonthlyPayroll({ ...args, overrides: [{ ...old, period_key: "2026-10" }] }), 1323.72);
  assert.equal(resolveMonthlyPayroll({ ...args, overrides: [{ ...old, breakdown_key: "tirso", driver_label: "Tirso" }] }), 1323.72);
});
test("subir o bajar nómina compensa el efectivo sin duplicar gastos; sin comisión repercute en neto", () => {
  const first = calculateDriverCommission({ driverName: "Alex", billing: 6000, payroll: 1200 });
  const next = calculateDriverCommission({ driverName: "Alex", billing: 6000, payroll: 1400 });
  assert.equal(next.totalToCollect, first.totalToCollect - 200);
  assert.equal(first.payroll + first.totalToCollect, next.payroll + next.totalToCollect);
  const low = calculateDriverCommission({ driverName: "Alex", billing: 4000, payroll: 1400 });
  assert.equal(low.totalToCollect, 0);
  assert.equal(4000 - low.payroll - low.totalToCollect, 2600);
});
