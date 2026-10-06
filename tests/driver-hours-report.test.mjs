import assert from "node:assert/strict";
import test from "node:test";
import { buildDriverHoursRows, getDriverHoursCompany, getDriverHoursDefaultShift, getDriverHoursWorker } from "../src/driverHoursReport.js";

test("el registro de jornada de Álex muestra su identidad laboral completa", () => {
  assert.deepEqual(getDriverHoursWorker("ÁLEX", "5043 MLC"), { name: "Alexandru Florin Radu", nif: "Y3789801J", affiliation: "28/14202868-68" });
  assert.deepEqual(getDriverHoursWorker("Tirso", "5043 MLC"), { name: "Tirso Rafael Rojano Gutiérrez", nif: "Z2451698H", affiliation: "28/16614610-02" });
  assert.deepEqual(getDriverHoursWorker("Tirso", "5750 MJV"), { name: "Tirso", nif: "", affiliation: "" });
});

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

test("aplica los turnos de Fernando, Andrés, Mauricio y Tirso", () => {
  assert.equal(getDriverHoursDefaultShift("Fernando", new Date(2026, 8, 29, 12), "Trabajado").entry, "16:30 / 21:30");
  assert.equal(getDriverHoursDefaultShift("Fernando", new Date(2026, 8, 27, 12), "Trabajado").entry, "");
  assert.equal(getDriverHoursDefaultShift("Andrés", new Date(2026, 8, 29, 12), "Trabajado").exit, "09:00 / 14:00");
  assert.equal(getDriverHoursDefaultShift("Andrés", new Date(2026, 8, 28, 12), "Trabajado").entry, "");
  assert.equal(getDriverHoursDefaultShift("Mauricio", new Date(2026, 8, 29, 12), "Trabajado").entry, "06:30 / 12:00");
  assert.equal(getDriverHoursDefaultShift("Tirso", new Date(2026, 8, 29, 12), "Trabajado").exit, "10:30 / 16:00");
});

test("Mauricio y Tirso completan dos descansos semanales con los días de menor facturación", () => {
  const rows = buildDriverHoursRows({ driverName: "Mauricio", month: 8, year: 2026, today: new Date(2026, 8, 30, 12), calendarRows: [
    { day: 1, active: false, billing: 0 }, { day: 2, active: true, billing: 90 }, { day: 3, active: true, billing: 40 }, { day: 4, active: true, billing: 120 },
  ] });
  assert.equal(rows.find((row) => row.day === 1).status, "Sin datos");
  assert.equal(rows.find((row) => row.day === 3).status, "Menor facturación semanal");
  assert.equal(rows.find((row) => row.day === 2).status, "Trabajado");
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
