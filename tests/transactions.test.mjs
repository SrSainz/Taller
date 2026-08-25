import test from "node:test";
import assert from "node:assert/strict";
import { operationsFromDocument, transactionsToDriverEntries } from "../src/transactions.js";

test("facturación crea operaciones centrales para total, efectivo y propinas en la fecha impresa", () => {
  const rows = operationsFromDocument({
    category: "billing",
    fields: { serviceDate: "2026-08-14", total: 240.88, cashCollected: 35, tips: 8.5, vehicle: "5754 MJV" },
    driverId: "driver-1",
    fileHash: "abc",
  });
  assert.deepEqual(rows.map(({ type, date, amount }) => ({ type, date, amount })), [
    { type: "billing", date: "2026-08-14", amount: 240.88 },
    { type: "cash", date: "2026-08-14", amount: 35 },
    { type: "tip", date: "2026-08-14", amount: 8.5 },
  ]);
});

test("la captura diaria conserva Precio neto y Reembolsos como conceptos independientes", () => {
  const rows = operationsFromDocument({
    category: "billing",
    recordType: "billing_daily",
    fields: { date: "2026-08-15", netAmount: 246.94, total: 247.94, tips: 1, refunds: 0.95, cashCollected: 151.3, vehicle: "5754 MJV" },
    driverId: "driver-1",
    fileHash: "daily-stats",
  });
  assert.deepEqual(rows.map(({ type, amount }) => ({ type, amount })), [
    { type: "billing", amount: 246.94 },
    { type: "cash", amount: 151.3 },
    { type: "tip", amount: 1 },
    { type: "refund", amount: 0.95 },
  ]);
  const entry = transactionsToDriverEntries(rows.map((operation, index) => ({
    id: `daily-${index}`,
    type: operation.type,
    occurred_on: operation.date,
    amount: operation.amount,
    driver_id: operation.driverId,
    vehicle_plate: operation.vehiclePlate,
    metadata: operation.metadata,
  })))[0];
  assert.equal(entry.billing, 246.94);
  assert.equal(entry.refunds, 0.95);
});

test("gasolina conserva fecha, vehículo, justificante y clave estable de duplicado", () => {
  const input = { category: "consumption", fields: { date: "2026-08-14", time: "19:42", ticketNumber: "R2602600017648", gasStation: "Plenergy Grupo, S.L.", cost: 72.4, consumption: 43.2, unit: "L" }, driverId: "driver-1", vehiclePlate: "5754 MJV", fileHash: "ticket" };
  const first = operationsFromDocument(input)[0];
  const second = operationsFromDocument(input)[0];
  assert.equal(first.type, "fuel");
  assert.equal(first.amount, 72.4);
  assert.equal(first.metadata.liters, 43.2);
  assert.equal(first.metadata.time, "19:42");
  assert.equal(first.metadata.ticketNumber, "R2602600017648");
  assert.equal(first.metadata.provider, "Plenergy Grupo, S.L.");
  assert.equal(first.dedupeKey, second.dedupeKey);
});

test("la proyección diaria suma una única fuente central para todas las pantallas", () => {
  const rows = transactionsToDriverEntries([
    { id: "1", type: "billing", occurred_on: "2026-08-14", amount: 240.88, driver_id: "d1", vehicle_plate: "5754 MJV", metadata: {} },
    { id: "2", type: "cash", occurred_on: "2026-08-14", amount: 35, driver_id: "d1", vehicle_plate: "5754 MJV", metadata: {} },
    { id: "3", type: "fuel", occurred_on: "2026-08-14", amount: 72.4, driver_id: "d1", vehicle_plate: "5754 MJV", metadata: { liters: 43.2 } },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].billing, 240.88);
  assert.equal(rows[0].cash_collected, 35);
  assert.equal(rows[0].fuel_cost, 72.4);
  assert.equal(rows[0].fuel_liters, 43.2);
});
