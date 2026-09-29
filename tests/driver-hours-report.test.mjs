import assert from "node:assert/strict";
import test from "node:test";
import { buildDriverHoursRows, getDriverHoursCompany, getDriverHoursDefaultShift } from "../src/driverHoursReport.js";

test("assigns the requested company to each professional plate", () => {
  assert.equal(getDriverHoursCompany("5754 MJV").name, "Aida Pérez Sal");
  assert.equal(getDriverHoursCompany("5750 MJV").name, "Aida Díaz Pérez");
  assert.equal(getDriverHoursCompany("5043 MLC").name, "David Díaz Muñoz");
});

test("Álex y Amin reciben los turnos nocturnos indicados y los descansos quedan vacíos", () => {
  assert.deepEqual(getDriverHoursDefaultShift("Amin", new Date(2026, 8, 25, 12), "Trabajado"), { entry: "19:00 / 00:30", exit: "23:00 / 04:30", ordinary: "8", agreed: "", voluntary: "" });
  assert.deepEqual(getDriverHoursDefaultShift("Álex", new Date(2026, 8, 27, 12), "Trabajado"), { entry: "19:00 / 00:00", exit: "00:00 / 03:00", ordinary: "8", agreed: "", voluntary: "" });
  assert.equal(getDriverHoursDefaultShift("Amin", new Date(2026, 8, 25, 12), "Sin datos").entry, "");
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
