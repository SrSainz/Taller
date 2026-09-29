import assert from "node:assert/strict";
import test from "node:test";
import { buildDriverHoursRows, getDriverHoursCompany } from "../src/driverHoursReport.js";

test("assigns the requested company to each professional plate", () => {
  assert.equal(getDriverHoursCompany("5754 MJV").name, "Aida Pérez Sal");
  assert.equal(getDriverHoursCompany("5750 MJV").name, "Aida Díaz Pérez");
  assert.equal(getDriverHoursCompany("5043 MLC").name, "David Díaz Muñoz");
});

test("records no-data days and one lowest-billing active day in each week", () => {
  const rows = buildDriverHoursRows({
    month: 8,
    year: 2026,
    today: new Date(2026, 8, 30, 12),
    calendarRows: [
      { day: 1, active: true, billing: 120 },
      { day: 2, active: true, billing: 80 },
      { day: 3, active: false, billing: 0 },
      { day: 8, active: true, billing: 50 },
      { day: 9, active: true, billing: 90 },
    ],
  });
  assert.equal(rows.find((row) => row.day === 2).status, "Menor facturación semanal");
  assert.equal(rows.find((row) => row.day === 3).status, "Sin datos");
  assert.equal(rows.find((row) => row.day === 8).status, "Menor facturación semanal");
  assert.equal(rows.find((row) => row.day === 9).hours, 8);
});

