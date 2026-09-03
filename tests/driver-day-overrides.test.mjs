import test from "node:test";
import assert from "node:assert/strict";

import {
  applyDriverBillingOverride,
  buildDriverBillingOverride,
  buildDriverFuelOverrideEntries,
  buildDriverMileageOverride,
  getDriverFuelEntriesForPeriod,
  mergeDriverDayOverride,
} from "../src/driverDayOverrides.js";

test("la corrección de facturación recalcula precio neto y ganancias sin perder los demás campos", () => {
  const override = buildDriverBillingOverride({
    connection: "7 h 21 m",
    trips: 22,
    points: 66,
    baseNetAmount: 211.15,
    promotions: 350,
    tips: 0.5,
    refunds: 1.25,
    cashCollected: 120,
  });
  const result = applyDriverBillingOverride({ dateKey: "2026-08-24", netAmount: 0, tips: 0 }, {
    entry_date: "2026-08-24",
    manual_overrides: { billing: override },
  });

  assert.equal(override.netAmount, 561.15);
  assert.equal(override.total, 561.65);
  assert.equal(result.netAmount, 561.15);
  assert.equal(result.total, 561.65);
  assert.equal(result.trips, 22);
  assert.equal(result.points, 66);
  assert.equal(result.refunds, 1.25);
  assert.equal(result.cashCollected, 120);
});

test("conserva como positivo el efectivo cobrado aunque el documento lo extraiga con signo negativo", () => {
  const override = buildDriverBillingOverride({ cashCollected: -85.25 });
  const result = applyDriverBillingOverride({ cashCollected: 0 }, {
    entry_date: "2026-09-01",
    manual_overrides: { billing: override },
  });

  assert.equal(override.cashCollected, 85.25);
  assert.equal(result.cashCollected, 85.25);
});

test("la proyección de repostajes conserva exactamente el total y el número corregido", () => {
  const entries = buildDriverFuelOverrideEntries({
    dateKey: "2026-08-24",
    override: { cost: 45.01, liters: 31.01, refuels: 3 },
    fallbackEntries: [
      { id: "fuel-1", cost: 10, liters: 7 },
      { id: "fuel-2", cost: 20, liters: 14 },
    ],
  });

  assert.equal(entries.length, 3);
  assert.equal(Number(entries.reduce((sum, entry) => sum + entry.cost, 0).toFixed(2)), 45.01);
  assert.equal(Number(entries.reduce((sum, entry) => sum + entry.liters, 0).toFixed(2)), 31.01);
  assert.equal(entries[0].date, "2026-08-24");
});

test("los resúmenes de combustible sustituyen solo el día corregido", () => {
  const entries = getDriverFuelEntriesForPeriod({
    driverId: "driver-1",
    vehiclePlate: "5754 MJV",
    month: 7,
    year: 2026,
    driverEntries: [{
      id: "entry-1",
      driver_id: "driver-1",
      vehicle_plate: "5754 MJV",
      entry_date: "2026-08-24",
      manual_overrides: { fuel: { cost: 45.01, liters: 31.01, refuels: 3 } },
    }],
    transactions: [
      { id: "fuel-1", type: "fuel", occurred_on: "2026-08-24", amount: 20, driver_id: "driver-1", vehicle_plate: "5754MJV", metadata: { liters: 14 } },
      { id: "fuel-2", type: "fuel", occurred_on: "2026-08-25", amount: 12.5, driver_id: "driver-1", vehicle_plate: "5754 MJV", metadata: { liters: 8 } },
    ],
  });

  assert.equal(entries.filter((entry) => entry.date === "2026-08-24").length, 3);
  assert.equal(entries.find((entry) => entry.date === "2026-08-25")?.cost, 12.5);
  assert.equal(Number(entries.reduce((sum, entry) => sum + entry.cost, 0).toFixed(2)), 57.51);
});

test("los cambios de kilometraje se guardan como valores diarios y acumulados explícitos", () => {
  assert.deepEqual(buildDriverMileageOverride({ dailyKm: "137,5", odometerKm: "210735" }), {
    dailyKm: 137.5,
    odometerKm: 210735,
  });
});

test("las correcciones de un panel se fusionan sin borrar las de los demás", () => {
  const entry = { manual_overrides: { fuel: { cost: 20, liters: 14, refuels: 1 } } };
  const merged = mergeDriverDayOverride(entry, "billing", { netAmount: 300 });
  assert.deepEqual(merged.fuel, entry.manual_overrides.fuel);
  assert.equal(merged.billing.netAmount, 300);
});
