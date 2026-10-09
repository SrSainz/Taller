import assert from "node:assert/strict";
import test from "node:test";
import { buildDriverHoursRows, getDriverHoursCompany, getDriverHoursDefaultShift, getDriverHoursWorker, migrateNightShiftRows } from "../src/driverHoursReport.js";

test("el registro de jornada de Álex muestra su identidad laboral completa", () => {
  assert.deepEqual(getDriverHoursWorker("ÁLEX", "5043 MLC"), { name: "Alexandru Florin Radu", nif: "Y3789801J", affiliation: "28/14202868-68" });
  assert.deepEqual(getDriverHoursWorker("Tirso", "5043 MLC"), { name: "Tirso Rafael Rojano Gutiérrez", nif: "Z2451698H", affiliation: "28/16614610-02" });
  assert.deepEqual(getDriverHoursWorker("Tirso", "5750 MJV"), { name: "Tirso", nif: "", affiliation: "" });
  assert.deepEqual(getDriverHoursWorker("Fernando", "5754 MJV"), { name: "Fernando Herrera Jiménez", nif: "05236080S", affiliation: "28/03298802-20" });
  assert.deepEqual(getDriverHoursWorker("Mauricio", "5750 MJV"), { name: "Mauricio Marchant Román", nif: "X0431578Y", affiliation: "28/04367992-CT6" });
  assert.deepEqual(getDriverHoursWorker("Amin", "5750 MJV"), { name: "Amin Sellami EL HASSANAOUI", nif: "05732189Z", affiliation: "28/13198435-70" });
});

test("assigns the requested company to each professional plate", () => {
  assert.equal(getDriverHoursCompany("5754 MJV").name, "Aida Pérez Sal");
  assert.equal(getDriverHoursCompany("5750 MJV").name, "Aida Díaz Pérez");
  assert.equal(getDriverHoursCompany("5043 MLC").name, "David Díaz Muñoz");
});

test("Álex y Amin reciben los turnos nocturnos indicados y los descansos quedan vacíos", () => {
  assert.deepEqual(getDriverHoursDefaultShift("Amin", new Date(2026, 8, 25, 12), "Trabajado"), { entry: "18:00 / 00:00", exit: "22:00 / 05:00", ordinary: "9", agreed: "", voluntary: "" });
  assert.deepEqual(getDriverHoursDefaultShift("Álex", new Date(2026, 8, 27, 12), "Trabajado"), { entry: "18:00", exit: "01:00 (+1 día)", ordinary: "7", agreed: "", voluntary: "" });
  assert.equal(getDriverHoursDefaultShift("Amin", new Date(2026, 8, 25, 12), "Sin datos").entry, "");
  assert.equal(getDriverHoursDefaultShift("Álex", new Date(2026, 8, 28, 12), "Trabajado").entry, "");
  assert.equal(getDriverHoursDefaultShift("Amin", new Date(2026, 8, 29, 12), "Trabajado").entry, "");
});

test("Álex y Amin descansan lunes y martes sin seleccionar días por menor facturación", () => {
  for (const driverName of ["Álex", "Amin"]) {
    const rows = buildDriverHoursRows({ driverName, month: 9, year: 2026, today: new Date(2026, 9, 12, 12), calendarRows: [
      { day: 4, active: true, billing: 5 }, { day: 5, active: true, billing: 100 }, { day: 6, active: true, billing: 100 },
      { day: 7, active: true, billing: 3 }, { day: 8, active: true, billing: 4 }, { day: 9, active: true, billing: 6 }, { day: 10, active: true, billing: 7 },
    ] });
    assert.equal(rows.find((row) => row.day === 4).hours, 7);
    assert.equal(rows.find((row) => row.day === 5).status, "Descanso");
    assert.equal(rows.find((row) => row.day === 6).status, "Descanso");
    assert.equal(rows.find((row) => row.day === 7).hours, 7);
    assert.equal(rows.find((row) => row.day === 9).hours, 9);
    assert.equal(rows.find((row) => row.day === 10).hours, 9);
  }
});

test("la plantilla antigua se actualiza sin sobrescribir horarios editados", () => {
  const defaults = { "2026-10-09": getDriverHoursDefaultShift("Álex", new Date(2026, 9, 9, 12), "Trabajado"), "2026-10-11": getDriverHoursDefaultShift("Álex", new Date(2026, 9, 11, 12), "Trabajado") };
  const migrated = migrateNightShiftRows("Álex", {
    "2026-10-09": { entry: "19:00 / 00:30", exit: "23:00 / 04:30", ordinary: "8" },
    "2026-10-10": { entry: "20:00", exit: "02:00", ordinary: "6" },
    "2026-10-11": { entry: "", exit: "", ordinary: "" },
  }, defaults, 2026, 9);
  assert.equal(migrated["2026-10-09"].entry, "18:00 / 00:00");
  assert.deepEqual(migrated["2026-10-10"], { entry: "20:00", exit: "02:00", ordinary: "6" });
  assert.equal(migrated["2026-10-11"].entry, "18:00");
});

test("aplica los turnos de Fernando, Andrés, Mauricio y Tirso", () => {
  assert.deepEqual(getDriverHoursDefaultShift("Fernando", new Date(2026, 8, 29, 12), "Trabajado"), { entry: "17:00", exit: "01:00 (+1 día)", ordinary: "8", agreed: "", voluntary: "" });
  assert.equal(getDriverHoursDefaultShift("Fernando", new Date(2026, 8, 27, 12), "Trabajado").entry, "");
  assert.equal(getDriverHoursDefaultShift("Fernando", new Date(2026, 8, 26, 12), "Trabajado").entry, "");
  assert.equal(getDriverHoursDefaultShift("Andrés", new Date(2026, 8, 29, 12), "Trabajado").exit, "09:00 / 14:00");
  assert.equal(getDriverHoursDefaultShift("Andrés", new Date(2026, 8, 28, 12), "Trabajado").entry, "");
  assert.equal(getDriverHoursDefaultShift("Mauricio", new Date(2026, 8, 29, 12), "Trabajado").entry, "06:30 / 12:00");
  assert.equal(getDriverHoursDefaultShift("Tirso", new Date(2026, 8, 29, 12), "Trabajado").exit, "10:30 / 16:00");
});

test("Fernando libra sábado y domingo sin descanso adicional por facturación", () => {
  const rows = buildDriverHoursRows({ driverName: "Fernando", month: 9, year: 2026, today: new Date(2026, 9, 12, 12), calendarRows: [
    { day: 5, active: true, billing: 1 }, { day: 6, active: true, billing: 2 }, { day: 7, active: true, billing: 3 },
    { day: 8, active: true, billing: 4 }, { day: 9, active: true, billing: 5 }, { day: 10, active: true, billing: 6 }, { day: 11, active: true, billing: 7 },
  ] });
  for (const day of [5, 6, 7, 8, 9]) assert.equal(rows.find((row) => row.day === day).status, "Trabajado");
  for (const day of [10, 11]) assert.equal(rows.find((row) => row.day === day).status, "Descanso");
  const defaults = { "2026-10-09": getDriverHoursDefaultShift("Fernando", new Date(2026, 9, 9, 12), "Trabajado") };
  const migrated = migrateNightShiftRows("Fernando", { "2026-10-09": { entry: "16:30 / 21:30", exit: "20:30 / 02:30", ordinary: "9" } }, defaults, 2026, 9);
  assert.equal(migrated["2026-10-09"].entry, "17:00");
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
