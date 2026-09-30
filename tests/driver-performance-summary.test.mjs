import test from "node:test";
import assert from "node:assert/strict";
import { getDriverPerformanceSummary } from "../src/driverPerformanceSummary.js";

test("el resumen mensual relaciona días facturados, horas, consumo y facturación", () => {
  const summary = getDriverPerformanceSummary({
    calendarRows: [
      { billing: 200, billingStats: { connectionHours: 8.5 } },
      { billing: 0, billingStats: { connectionHours: 0 } },
      { billing: 300, billingStats: { connectionHours: 10 } },
    ],
    billing: 500,
    fuelCost: 25,
    daysInMonth: 30,
  });
  assert.deepEqual(summary, { hours: 18.5, efficiency: 7, fuelToBilling: 5, billingPerHour: 500 / 18.5 });
});

test("sin facturación ni horas no muestra ratios inválidos", () => {
  assert.deepEqual(getDriverPerformanceSummary({ calendarRows: [{ billing: 0 }], daysInMonth: 31 }), {
    hours: 0,
    efficiency: 0,
    fuelToBilling: 0,
    billingPerHour: 0,
  });
});
