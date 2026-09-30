import test from "node:test";
import assert from "node:assert/strict";
import { getDriverPerformanceSummary } from "../src/driverPerformanceSummary.js";

test("el resumen mensual relaciona días facturados, horas, consumo y facturación", () => {
  const summary = getDriverPerformanceSummary({
    calendarRows: [
      { day: 1, billing: 200, fuelCost: 10, km: 200, billingStats: { connectionHours: 8.5 } },
      { day: 2, billing: 0, fuelCost: 0, km: 0, billingStats: { connectionHours: 0 } },
      { day: 8, billing: 300, fuelCost: 15, km: 300, billingStats: { connectionHours: 10 } },
    ],
    billing: 500,
    fuelCost: 25,
    fuelLiters: 30,
    daysInMonth: 30,
    year: 2026,
    month: 8,
  });
  assert.equal(summary.hours, 18.5);
  assert.equal(summary.efficiency, 93);
  assert.equal(summary.fuelToBilling, 5);
  assert.equal(summary.billingPerHour, 500 / 18.5);
  assert.deepEqual(summary.weeks.map(({ number, startDay, endDay, fuelToBilling, billingPerHour }) => ({ number, startDay, endDay, fuelToBilling, billingPerHour })), [
    { number: 1, startDay: 1, endDay: 6, fuelToBilling: 5, billingPerHour: 200 / 8.5 },
    { number: 2, startDay: 7, endDay: 13, fuelToBilling: 5, billingPerHour: 30 },
    { number: 3, startDay: 14, endDay: 20, fuelToBilling: null, billingPerHour: null },
    { number: 4, startDay: 21, endDay: 27, fuelToBilling: null, billingPerHour: null },
    { number: 5, startDay: 28, endDay: 30, fuelToBilling: null, billingPerHour: null },
  ]);
});

test("sin facturación ni horas no muestra ratios inválidos", () => {
  const summary = getDriverPerformanceSummary({ calendarRows: [{ day: 1, billing: 0 }], daysInMonth: 31, year: 2026, month: 9 });
  assert.deepEqual({ hours: summary.hours, efficiency: summary.efficiency, fuelToBilling: summary.fuelToBilling, billingPerHour: summary.billingPerHour }, {
    hours: 0,
    efficiency: null,
    fuelToBilling: 0,
    billingPerHour: 0,
  });
  assert.equal(summary.weeks.length, 5);
  assert.ok(summary.weeks.every((week) => week.fuelToBilling === null && week.billingPerHour === null));
});

test("las horas solo suman conexiones de los informes diarios y la eficiencia responde a todos los factores", () => {
  const calendarRows = [
    { day: 1, billing: 240, km: 200, billingStats: { connectionHours: 8 } },
    { day: 2, billing: 240, km: 200, billingStats: { connectionHours: 8 } },
    { day: 3, billing: 120, km: 100 }, // Facturación sin informe de horas.
  ];
  const base = { calendarRows, billing: 600, fuelCost: 60, fuelLiters: 25, daysInMonth: 30, year: 2026, month: 8 };
  const summary = getDriverPerformanceSummary(base);
  assert.equal(summary.hours, 16);
  assert.equal(summary.efficiency, 100);
  assert.ok(getDriverPerformanceSummary({ ...base, fuelCost: 120 }).efficiency < summary.efficiency);
  assert.ok(getDriverPerformanceSummary({ ...base, fuelLiters: 50 }).efficiency < summary.efficiency);
  assert.ok(getDriverPerformanceSummary({ ...base, billing: 300 }).efficiency < summary.efficiency);
  assert.ok(getDriverPerformanceSummary({ ...base, calendarRows: calendarRows.map((day) => ({ ...day, billingStats: { connectionHours: 12 } })) }).efficiency < summary.efficiency);
  assert.ok(getDriverPerformanceSummary({ ...base, calendarRows: calendarRows.map((day) => ({ ...day, km: day.km * 2 })), fuelLiters: 50 }).efficiency < summary.efficiency);
});
